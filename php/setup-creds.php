<?php
/**
 * One-time server credential setup endpoint (self-destructing).
 * NEVER contains hardcoded secrets. Receives payload over TLS POST with security token.
 */
header('Content-Type: application/json; charset=utf-8');

$expectedToken = 'csm_setup_token_9f3a1804b72e81a7_secure';
$authHeader = $_SERVER['HTTP_X_CSM_SETUP_KEY'] ?? '';

if ($authHeader !== $expectedToken) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'message' => 'Forbidden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || empty($data['app_password']) || empty($data['sender_email']) || empty($data['me_email'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Missing required fields']);
    exit;
}

$senderEmail = addcslashes($data['sender_email'], "'\\");
$senderName  = addcslashes($data['sender_name'] ?? 'CSM Engine', "'\\");
$appPassword = addcslashes($data['app_password'], "'\\");
$smtpHost    = addcslashes($data['smtp_host'] ?? 'smtp.gmail.com', "'\\");
$smtpPort    = (int)($data['smtp_port'] ?? 587);
$smtpDebug   = (int)($data['smtp_debug'] ?? 0);
$meEmail     = addcslashes($data['me_email'], "'\\");

$credsContent = "<?php\n"
    . "return [\n"
    . "    'sender_email'  => '{$senderEmail}',\n"
    . "    'sender_name'   => '{$senderName}',\n"
    . "    'app_password'  => '{$appPassword}',\n"
    . "    'smtp_host'     => '{$smtpHost}',\n"
    . "    'smtp_port'     => {$smtpPort},\n"
    . "    'smtp_debug'    => {$smtpDebug},\n"
    . "    'me_email'      => '{$meEmail}',\n"
    . "];\n";

$targetFile = __DIR__ . '/config.creds.php';
$bytesWritten = file_put_contents($targetFile, $credsContent, LOCK_EX);

if ($bytesWritten === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Failed to write config.creds.php to server disk']);
    exit;
}

// Self-destruct
@unlink(__FILE__);

echo json_encode([
    'ok' => true,
    'bytes' => $bytesWritten,
    'target' => 'config.creds.php',
    'self_deleted' => !file_exists(__FILE__),
    'message' => 'config.creds.php created successfully on server.'
]);
