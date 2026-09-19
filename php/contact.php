<?php
/**
 * CSM Engine — Contact Mail Gateway
 * Generic endpoint for static-site contact forms.
 * Expects POST with form fields; sends email via PHPMailer + Gmail SMTP.
 *
 * Usage:
 *   <form action="/php/contact.php" method="POST">
 *
 * Returns JSON: { ok: true/false, message?: string, errors?: string[] }
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';
require_once __DIR__ . '/PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function json($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Fail gracefully (not a PHP fatal) when server creds are not yet configured
if (!$mailConfigured) {
    json(['ok' => false, 'code' => 'not_configured', 'message' => 'Online signup is temporarily unavailable. Please email founders@csmengine.dev.']);
}

function sanitize($v) {
    return trim(strip_tags($v));
}

function isSpam($botcheck) {
    return !empty($botcheck);
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json(['ok' => false, 'message' => 'Method not allowed']);
}

$required = $argv[1] ?? null; // optional: pass a comma list of required fields from caller? No, use expected map.

// We detect form type by a hidden "form_type" field (not in URL - cleaner).
// For mailgate.php we use type param. For contact.php we just use all POST fields.
$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: $_POST;

$errors = [];

// Botcheck honeypot
if (isset($body['botcheck']) && !empty($body['botcheck'])) {
    json(['ok' => false, 'message' => 'Spam detected']);
}

// Build a clean payload from whatever the form sent (strip known fields)
$payload = [];
$allowed = [
    'name','email','company','role','builder_tool','fund','message',
    'access_key','subject','from_name'
];
foreach ($body as $k => $v) {
    $key = (string)$k;
    if (in_array($key, $allowed, true)) {
        $payload[$key] = sanitize($v);
    }
}

// Basic email validation (if email present)
if (isset($payload['email']) && $payload['email'] !== '') {
    if (!filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Please enter a valid email address.';
    }
}

if ($errors) {
    json(['ok' => false, 'message' => implode(' ', $errors)]);
}

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
    }

    $mail->setFrom($gSender, $gName);
    $mail->addAddress($meEmail);

    // Subject: default or from form
    $subject = $payload['subject']
        ?? ($payload['name'] ? (isset($payload['form_type']) ? $payload['form_type'] : 'New CSM Engine Form Submission') : 'New CSM Engine Form Submission');
    $mail->Subject = $subject;

    // Body: structured plain text + basic HTML
    $mail->isHTML(false);
    $lines = [];
    foreach ($payload as $k => $v) {
        if ($v !== '') {
            $label = ucwords(str_replace(['_','-'], ' ', $k));
            $lines[] = "{$label}: {$v}";
        }
    }
    $mail->Body = implode("\n", $lines);

    $mail->send();
    json(['ok' => true, 'message' => 'Message sent successfully']);
} catch (Exception $e) {
    json([
        'ok' => false,
        'message' => 'Could not send message. Please try again or email us directly.',
        'debug' => $gDebug > 0 ? $mail->ErrorInfo : null
    ]);
}
