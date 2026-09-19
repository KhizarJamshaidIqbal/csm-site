<?php
/**
 * CSM Engine — Mail config loader (SAFE, committed to git, contains NO secrets).
 *
 * This file loads the private credentials from config.creds.php (gitignored,
 * created once on the server via Hostinger hPanel File Manager). If that file
 * is missing, mail sending is disabled gracefully (endpoints return a clear
 * JSON error instead of a PHP fatal).
 */

$credsFile = __DIR__ . '/config.creds.php';
$creds = is_readable($credsFile) ? include $credsFile : [];

if (!is_array($creds)) { $creds = []; }

// Sending account (must be a Gmail you own, with an App Password)
$gSender = $creds['sender_email'] ?? '';
$gName   = $creds['sender_name']  ?? 'CSM Engine';
$gPass   = $creds['app_password'] ?? '';   // 16-char Gmail App Password, no spaces
$gHost   = $creds['smtp_host']    ?? 'smtp.gmail.com';
$gPort   = (int)($creds['smtp_port'] ?? 587);
$gDebug  = (int)($creds['smtp_debug'] ?? 0);

// Inbox that receives the form submissions
$meEmail = $creds['me_email'] ?? '';

// True only when all required creds are present
$mailConfigured = ($gSender !== '' && $gPass !== '' && $meEmail !== '');
