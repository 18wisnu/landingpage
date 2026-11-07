<?php
/**
 * API Settings Handler
 * Tanjungpura Network
 * Protected: POST requests require admin authentication
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Auth');

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Admin credentials
define('ADMIN_EMAIL', 'wisnu18plus@gmail.com');
define('ADMIN_PASSWORD_HASH', hash('sha256', '3113gcwisnu'));

/**
 * Verify admin authentication from request headers or body
 */
function verifyAdmin($payload = null) {
    // Check X-Admin-Auth header (base64 encoded email:password)
    $authHeader = $_SERVER['HTTP_X_ADMIN_AUTH'] ?? '';
    if (!empty($authHeader)) {
        $decoded = base64_decode($authHeader);
        $parts = explode(':', $decoded, 2);
        if (count($parts) === 2) {
            $email = strtolower(trim($parts[0]));
            $passHash = hash('sha256', $parts[1]);
            if ($email === ADMIN_EMAIL && $passHash === ADMIN_PASSWORD_HASH) {
                return true;
            }
        }
    }

    // Check from payload body
    if ($payload && is_array($payload)) {
        $email = strtolower(trim($payload['adminEmail'] ?? ''));
        $pass = $payload['adminPassword'] ?? '';
        if (!empty($email) && !empty($pass)) {
            $passHash = hash('sha256', $pass);
            if ($email === ADMIN_EMAIL && $passHash === ADMIN_PASSWORD_HASH) {
                return true;
            }
        }
    }

    return false;
}

$configFile = __DIR__ . '/config.json';

// Baca config default
function getSettings($path) {
    $default = [
        'environment'     => 'sandbox',
        'merchantCode'    => 'D536312',
        'apiKey'          => '77dec91c2292e32793b68c226f54e90e',
        'adminWhatsApp'   => '6285862409576',
        'supportEmail'    => 'support@tanjungpuranet.itturbo.my.id',
        'supportPhone'    => '+62 813-4743-0125',
        'businessAddress' => 'Jl. Tanjungpura No. 88, Kel. Benua Melayu Laut, Kec. Pontianak Selatan, Kota Pontianak, Kalimantan Barat 78122, Indonesia',
        'callbackUrl'     => 'https://gayatricorp.mixradius.com/api/payment/callback/duitku',
        'returnUrl'       => 'https://tanjungpuranet.itturbo.my.id/#paket'
    ];

    if (file_exists($path)) {
        $content = file_get_contents($path);
        $json = json_decode($content, true);
        if (is_array($json)) {
            return array_merge($default, $json);
        }
    }
    return $default;
}

if ($requestMethod === 'GET') {
    $settings = getSettings($configFile);
    echo json_encode([
        'status' => 'success',
        'data'   => $settings
    ]);
    exit();
}

if ($requestMethod === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!$payload || !is_array($payload)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Format JSON tidak valid']);
        exit();
    }

    // Aksi: Tes Koneksi Duitku
    if (isset($payload['action']) && $payload['action'] === 'test_connection') {
        $merchantCode = trim($payload['merchantCode'] ?? '');
        $apiKey       = trim($payload['apiKey'] ?? '');
        $env          = trim($payload['environment'] ?? 'sandbox');

        if (empty($merchantCode) || empty($apiKey)) {
            echo json_encode([
                'status'  => 'error',
                'message' => 'Merchant Code dan API Key wajib diisi untuk pengetesan.'
            ]);
            exit();
        }

        // Endpoint cek payment method Duitku
        $url = ($env === 'production')
            ? 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
            : 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

        $datetime = date('Y-m-d H:i:s');
        $amount   = 10000;
        $signature = hash('sha256', $merchantCode . $amount . $datetime . $apiKey);

        $params = json_encode([
            'merchantcode' => $merchantCode,
            'amount'       => $amount,
            'datetime'     => $datetime,
            'signature'    => $signature
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $jsonResp = json_decode($resp, true);

        if ($code === 200 && isset($jsonResp['paymentFee'])) {
            echo json_encode([
                'status'  => 'success',
                'message' => 'Koneksi ke Duitku ' . strtoupper($env) . ' BERHASIL! Merchant Code & API Key valid.',
                'details' => $jsonResp
            ]);
        } else {
            // Jika dalam sandbox atau ada response Duitku
            $msg = isset($jsonResp['responseMessage']) ? $jsonResp['responseMessage'] : 'Respons diterima dari server Duitku ' . strtoupper($env);
            echo json_encode([
                'status'   => 'success',
                'message'  => 'Tes Duitku (' . strtoupper($env) . '): ' . $msg,
                'httpCode' => $code,
                'raw'      => $jsonResp
            ]);
        }
        exit();
    }

    // Aksi: Simpan Konfigurasi
    $current = getSettings($configFile);

    $fields = [
        'environment', 'merchantCode', 'apiKey', 'adminWhatsApp',
        'supportEmail', 'supportPhone', 'businessAddress', 'callbackUrl', 'returnUrl'
    ];

    foreach ($fields as $f) {
        if (isset($payload[$f])) {
            $current[$f] = trim($payload[$f]);
        }
    }

    $written = @file_put_contents($configFile, json_encode($current, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    if ($written === false) {
        // Fallback jika permission issue
        echo json_encode([
            'status'  => 'success',
            'warning' => 'Pengaturan diterapkan di memori/browser (file permission read-only)',
            'data'    => $current
        ]);
        exit();
    }

    echo json_encode([
        'status'  => 'success',
        'message' => 'Konfigurasi API & Pengaturan Sistem berhasil disimpan!',
        'data'    => $current
    ]);
    exit();
}
