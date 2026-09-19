<?php
/**
 * CSM Engine — Mail Gate (waitlist + deck forms)
 *
 * Receives via POST/JSON and forwards to the sender's Gmail via PHPMailer.
 * Also logs submissions to a local text file (append-only) as a durable
 * backup so no lead is lost even if email delivery hiccups.
 *
 * Endpoints:
 *   POST /php/mailgate.php
 *
 * Required extra fields in payload:
 *   type: "waitlist" | "deck"
 *
 * Returns JSON: { ok: true/false, message?: string }
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

function json($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Simple per-IP sliding-window rate limit: 10 requests / 60 seconds
$rlFile = sys_get_temp_dir() . '/csm_rl_' . md5($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '.json';
$now = time();
$hits = is_readable($rlFile) ? json_decode((string)file_get_contents($rlFile), true) : [];
if (!is_array($hits)) { $hits = []; }
$hits = array_values(array_filter($hits, fn($t) => ($now - (int)$t) < 60));
if (count($hits) >= 10) {
    json(['ok' => false, 'code' => 'rate_limited', 'message' => 'Too many requests. Please wait a minute and try again.'], 429);
}
$hits[] = $now;
@file_put_contents($rlFile, json_encode($hits), LOCK_EX);

// Fail gracefully (not a PHP fatal) when server creds are not yet configured
if (!$mailConfigured) {
    json(['ok' => false, 'code' => 'not_configured', 'message' => 'Online signup is temporarily unavailable. Please email founders@csmengine.dev.']);
}

function sanitize($v) {
    return trim(strip_tags((string)$v));
}

function spamCheck($botcheck) {
    return !empty($botcheck);
}

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json(['ok' => false, 'message' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: $_POST;

// Spam honeypot
if (isset($body['botcheck']) && !empty($body['botcheck'])) {
    json(['ok' => false, 'message' => 'Spam detected'], 400);
}

// Normalize payload
$payload = [];
$allowed = [
    'name','email','company','role','builder_tool','fund','timestamp','type'
];
foreach ($body as $k => $v) {
    $key = (string)$k;
    if (in_array($key, $allowed, true)) {
        $payload[$key] = sanitize($v);
    }
}

// Validate required pieces
$type = $payload['type'] ?? '';
if (!in_array($type, ['waitlist', 'deck'], true)) {
    json(['ok' => false, 'message' => 'Invalid form type.'], 400);
}

if (empty($payload['email']) || !filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
    json(['ok' => false, 'message' => 'Please enter a valid email address.'], 400);
}

// Subject + from_name based on type
switch ($type) {
    case 'waitlist':
        $defaultSubject = 'New CSM Engine Waitlist Signup';
        $defaultFromName = 'CSM Engine Waitlist';
        break;
    case 'deck':
    default:
        $defaultSubject = 'New CSM Engine Pitch Deck Request';
        $defaultFromName = 'CSM Engine Investor Portal';
}

// Subject is server-controlled; client cannot override it.
$subject = $defaultSubject;
$fromName = $defaultFromName;

// Build body
$rows = [];
if (!empty($payload['ticketNumber'])) {
    $rows[] = "Ticket: #{$payload['ticketNumber']}";
}
foreach ($payload as $k => $v) {
    if (in_array($k, ['type','botcheck','access_key','subject','from_name','timestamp'], true)) {
        continue;
    }
    if ($v !== '') {
        $rows[] = ucwords(str_replace(['_','-'], ' ', $k)) . ': ' . $v;
    }
}
$bodyText = implode("\n\n", $rows);

// Optional JSON log (must be writable on server; list only count + time if private)
$logFile = __DIR__ . '/submissions.log';
$logEntry = json_encode([
    'ts' => date('c'),
    'type' => $type,
    'email' => $payload['email'],
    'name' => $payload['name'] ?: null,
    'company' => $payload['company'] ?: null,
    'role' => $payload['role'] ?: null,
    'fund' => $payload['fund'] ?: null,
], JSON_UNESCAPED_SLASHES) . "\n";

try {
    // Send email
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
    }

    $mail->setFrom($gSender, $fromName);
    $mail->addAddress($meEmail);
    $mail->Subject = $subject;
    $mail->Body    = $bodyText;
    $mail->AltBody = strip_tags($bodyText);

    $mail->send();

    // Append to local log (non-fatal if fails)
    if (@file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX) === false) {
        // still ok — email went through
    }

    // Durable local backup on success AND failure so no lead is ever lost
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

    json(['ok' => true, 'message' => 'Submission received.']);
} catch (Exception $e) {
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    json([
        'ok' => false,
        'message' => 'Could not send your message. Please try again, or email us directly.',
        'debug' => $gDebug > 0 ? $mail->ErrorInfo : null
    ], 502);
}
