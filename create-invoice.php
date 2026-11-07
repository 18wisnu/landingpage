<?php
/**
 * Duitku Payment Gateway - Sandbox Create Invoice
 * Tanjungpura Network
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'POST';

if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($requestMethod !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Use POST.']);
    exit();
}

// Baca JSON body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON input.']);
    exit();
}

// -------------------------------------------------------------
// KONFIGURASI DUITKU (DIBACA DARI config.json ATAU MENU PENGATURAN API)
// -------------------------------------------------------------
$configFile  = __DIR__ . '/config.json';
$merchantCode = 'D536312'; // Duitku Sandbox Merchant Code
$apiKey       = '77dec91c2292e32793b68c226f54e90e'; // Duitku Sandbox API Key
$environment  = 'sandbox';

if (file_exists($configFile)) {
    $cfg = json_decode(file_get_contents($configFile), true);
    if (is_array($cfg)) {
        if (!empty($cfg['merchantCode'])) $merchantCode = trim($cfg['merchantCode']);
        if (!empty($cfg['apiKey'])) $apiKey = trim($cfg['apiKey']);
        if (!empty($cfg['environment'])) $environment = trim($cfg['environment']);
    }
}

$sandboxUrl = ($environment === 'production')
    ? 'https://api-prod.duitku.com/api/merchant/createInvoice'
    : 'https://api-sandbox.duitku.com/api/merchant/createInvoice';

// Ambil input pembayaran
$paymentAmount   = isset($data['amount']) ? (int)$data['amount'] : 200000;
$productDetails  = isset($data['productDetails']) ? trim($data['productDetails']) : 'Paket Internet Tanjungpura Net';
$email           = isset($data['email']) ? trim($data['email']) : 'pelanggan@tanjungpuranet.itturbo.my.id';
$phoneNumber     = isset($data['phoneNumber']) ? trim($data['phoneNumber']) : '085862409576';
$customerVaName  = isset($data['customerName']) ? trim($data['customerName']) : 'Pelanggan TPRNet';
$paymentMethod   = isset($data['paymentMethod']) ? trim($data['paymentMethod']) : 'SP'; // Default ShopeePay / QRIS / VA
$merchantOrderId = 'INV-' . date('YmdHis') . '-' . rand(100, 999);

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'tanjungpuranet.itturbo.my.id';
$callbackUrl = 'https://gayatricorp.mixradius.com/api/payment/callback/duitku';
$returnUrl   = $protocol . $host . '/#paket';

// Formula Signature Duitku POP Create Invoice: md5(merchantCode + merchantOrderId + paymentAmount + apiKey)
$signature = md5($merchantCode . $merchantOrderId . $paymentAmount . $apiKey);

$params = [
    'merchantCode'     => $merchantCode,
    'paymentAmount'    => $paymentAmount,
    'paymentMethod'    => $paymentMethod,
    'merchantOrderId'  => $merchantOrderId,
    'productDetails'   => $productDetails,
    'additionalParam'  => '',
    'merchantUserInfo' => $email,
    'customerVaName'   => $customerVaName,
    'email'            => $email,
    'phoneNumber'      => $phoneNumber,
    'callbackUrl'      => $callbackUrl,
    'returnUrl'        => $returnUrl,
    'signature'        => $signature,
    'expiryPeriod'     => 60
];

$jsonParams = json_encode($params);

// Kirim HTTP request ke Duitku Sandbox
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $sandboxUrl);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonParams);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($jsonParams)
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr || $httpCode !== 200) {
    // Fallback response bila kredensial sandbox belum diganti atau API Duitku down
    $simulatedReference = 'TPR-SBX-' . strtoupper(substr(md5(uniqid()), 0, 12));
    echo json_encode([
        'status'          => 'success',
        'isSimulated'     => true,
        'reference'       => $simulatedReference,
        'merchantOrderId' => $merchantOrderId,
        'amount'          => $paymentAmount,
        'productDetails'  => $productDetails,
        'customerName'    => $customerVaName,
        'email'           => $email,
        'phoneNumber'     => $phoneNumber,
        'paymentUrl'      => 'https://sandbox.duitku.com/payment/landing?ref=' . $simulatedReference,
        'message'         => 'Sandbox reference generated successfully.'
    ]);
    exit();
}

$duitkuResult = json_decode($response, true);
echo json_encode([
    'status'          => 'success',
    'isSimulated'     => false,
    'reference'       => isset($duitkuResult['reference']) ? $duitkuResult['reference'] : 'TPR-' . time(),
    'paymentUrl'      => isset($duitkuResult['paymentUrl']) ? $duitkuResult['paymentUrl'] : '',
    'merchantOrderId' => $merchantOrderId,
    'amount'          => $paymentAmount,
    'productDetails'  => $productDetails,
    'duitkuResponse'  => $duitkuResult
]);
