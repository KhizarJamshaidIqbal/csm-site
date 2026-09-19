<?php
/**
 * CSM Engine — Mail Gate (waitlist + deck forms)
 *
 * Receives JSON (or form-encoded) POST and forwards it to the configured inbox
 * via PHPMailer/SMTP. Every accepted submission is appended to submissions.log
 * whether or not SMTP delivery succeeds, so no lead is lost.
 *
 * Endpoint:  POST /php/mailgate.php
 * Payload:   { type: "waitlist" | "deck", email, name?, company?, role?, builder_tool?, fund?, timestamp?, botcheck? }
 * Response:  { ok: bool, code?: string, message?: string }
 *
 * HTTP codes: 200 ok, 400 validation, 405 method, 429 rate limited, 502 smtp failure, 503 not configured
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';
require_once __DIR__ . '/PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

const CSM_ALLOWED_FIELDS = ['name', 'email', 'company', 'role', 'builder_tool', 'fund', 'timestamp', 'type'];
const CSM_FORM_TYPES = [
    'waitlist' => ['subject' => 'New CSM Engine Waitlist Signup',     'from' => 'CSM Engine Waitlist'],
    'deck'     => ['subject' => 'New CSM Engine Pitch Deck Request',  'from' => 'CSM Engine Investor Portal'],
];
const CSM_RATE_LIMIT = 10;      // requests
const CSM_RATE_WINDOW = 60;     // seconds

function json(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sanitize($v): string {
    return trim(strip_tags((string)$v));
}

/** Sliding-window per-IP limiter backed by a temp file. Returns true when the request is allowed. */
function rateLimitAllows(string $ip): bool {
    $file = sys_get_temp_dir() . '/csm_rl_' . md5($ip) . '.json';
    $now = time();
    $hits = is_readable($file) ? json_decode((string)file_get_contents($file), true) : [];
    if (!is_array($hits)) { $hits = []; }
    $hits = array_values(array_filter($hits, fn($t) => ($now - (int)$t) < CSM_RATE_WINDOW));
    if (count($hits) >= CSM_RATE_LIMIT) {
        return false;
    }
    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return true;
}

function appendLog(string $type, array $payload): void {
    $entry = json_encode([
        'ts'      => date('c'),
        'type'    => $type,
        'email'   => $payload['email'],
        'name'    => $payload['name']    ?? null,
        'company' => $payload['company'] ?? null,
        'role'    => $payload['role']    ?? null,
        'fund'    => $payload['fund']    ?? null,
    ], JSON_UNESCAPED_SLASHES) . "\n";
    @file_put_contents(__DIR__ . '/submissions.log', $entry, FILE_APPEND | LOCK_EX);
}

// 1. Method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

// 2. Rate limit
if (!rateLimitAllows($_SERVER['REMOTE_ADDR'] ?? 'unknown')) {
    json(['ok' => false, 'code' => 'rate_limited', 'message' => 'Too many requests. Please wait a minute and try again.'], 429);
}

// 3. Configuration (fail gracefully, never a PHP fatal)
if (!$mailConfigured) {
    json(['ok' => false, 'code' => 'not_configured', 'message' => 'Online signup is temporarily unavailable. Please email info@epsoldev.com.'], 503);
}

// 4. Parse body (JSON first, form-encoded fallback)
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    $body = $_POST;
}

// 5. Honeypot
if (!empty($body['botcheck'])) {
    json(['ok' => false, 'message' => 'Spam detected'], 400);
}

// 6. Allow-list + sanitize
$payload = [];
foreach (CSM_ALLOWED_FIELDS as $key) {
    if (array_key_exists($key, $body)) {
        $payload[$key] = sanitize($body[$key]);
    }
}

// 7. Validate
$type = $payload['type'] ?? '';
if (!isset(CSM_FORM_TYPES[$type])) {
    json(['ok' => false, 'message' => 'Invalid form type.'], 400);
}
if (empty($payload['email']) || !filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
    json(['ok' => false, 'message' => 'Please enter a valid email address.'], 400);
}

// 8. Compose (subject and sender name are server-controlled)
$subject  = CSM_FORM_TYPES[$type]['subject'];
$fromName = CSM_FORM_TYPES[$type]['from'];

$rows = [];
foreach ($payload as $k => $v) {
    if (in_array($k, ['type', 'timestamp'], true) || $v === '') {
        continue;
    }
    $rows[] = ucwords(str_replace(['_', '-'], ' ', $k)) . ': ' . $v;
}
$bodyText = implode("\n\n", $rows);

// 9. Durable local backup before attempting delivery
appendLog($type, $payload);

// 10. Send
try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $gHost;
    $mail->SMTPAuth   = true;
    $mail->Username   = $gSender;
    $mail->Password   = $gPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $gPort;
    if ($gDebug > 0) {
        $mail->SMTPDebug = $gDebug === 2 ? SMTP::DEBUG_SERVER : SMTP::DEBUG_CONNECTION;
        $mail->Debugoutput = 'error_log'; // keep SMTP chatter out of the JSON response body
    }

    $mail->setFrom($gSender, $fromName);
    $mail->addAddress($meEmail);
    $mail->Subject = $subject;
    $mail->Body    = $bodyText;
    $mail->AltBody = $bodyText;

    $mail->send();

    json(['ok' => true, 'message' => 'Submission received.']);
} catch (Exception $e) {
    json([
        'ok' => false,
        'message' => 'Could not send your message. Please try again, or email us directly.',
        'debug' => $gDebug > 0 ? $mail->ErrorInfo : null
    ], 502);
}
