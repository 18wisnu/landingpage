<?php
/**
 * Duitku Payment Gateway - Callback / IPN Handler
 * Tanjungpura Network
 *
 * Endpoint ini dipanggil oleh server Duitku secara otomatis (server-to-server)
 * setiap kali status transaksi berubah (berhasil, pending, gagal).
 *
 * URL Callback harus didaftarkan di Dashboard Duitku:
 *   https://tanjungpuranet.itturbo.my.id/callback.php
 *
 * Dokumentasi resmi: https://docs.duitku.com/api/id/#callback
 */

// Baca konfigurasi dari config.json
$configFile   = __DIR__ . '/config.json';
$merchantCode = 'D12345';
$apiKey       = 'sandbox_api_key_tprnet_2026';

if (file_exists($configFile)) {
    $cfg = json_decode(file_get_contents($configFile), true);
    if (is_array($cfg)) {
        if (!empty($cfg['merchantCode'])) $merchantCode = trim($cfg['merchantCode']);
        if (!empty($cfg['apiKey']))       $apiKey       = trim($cfg['apiKey']);
    }
}

// Baca data POST dari Duitku
$merchantOrderId = isset($_POST['merchantOrderId']) ? $_POST['merchantOrderId'] : '';
$productDetail   = isset($_POST['productDetail'])   ? $_POST['productDetail']   : '';
$additionalParam = isset($_POST['additionalParam']) ? $_POST['additionalParam'] : '';
$paymentCode     = isset($_POST['paymentCode'])     ? $_POST['paymentCode']     : '';
$resultCode      = isset($_POST['resultCode'])      ? $_POST['resultCode']      : '';
$merchantUserId  = isset($_POST['merchantUserId'])  ? $_POST['merchantUserId']  : '';
$reference       = isset($_POST['reference'])       ? $_POST['reference']       : '';
$amount          = isset($_POST['amount'])          ? $_POST['amount']          : '';
$publisherOrderId = isset($_POST['publisherOrderId']) ? $_POST['publisherOrderId'] : '';
$spUserHash      = isset($_POST['spUserHash'])      ? $_POST['spUserHash']      : '';
$settledTime     = isset($_POST['settledTime'])     ? $_POST['settledTime']     : '';
$issuerInfo      = isset($_POST['issuerInfo'])      ? $_POST['issuerInfo']      : '';
$receiverInfo    = isset($_POST['receiverInfo'])    ? $_POST['receiverInfo']    : '';
$signature       = isset($_POST['signature'])       ? $_POST['signature']       : '';
$paymentMethod   = isset($_POST['paymentMethod'])   ? $_POST['paymentMethod']   : '';

// -----------------------------------------------------------------------
// VERIFIKASI SIGNATURE DUITKU
// Formula: md5(merchantCode + amount + merchantOrderId + apiKey)
// -----------------------------------------------------------------------
$expectedSignature = md5($merchantCode . $amount . $merchantOrderId . $apiKey);

if ($signature !== $expectedSignature) {
    // Signature tidak cocok — tolak request (bisa jadi pemalsuan)
    http_response_code(400);
    echo 'Bad Signature';

    // Log error
    logCallback('SIGNATURE_MISMATCH', [
        'merchantOrderId' => $merchantOrderId,
        'amount'          => $amount,
        'expected'        => $expectedSignature,
        'received'        => $signature,
    ]);
    exit();
}

// -----------------------------------------------------------------------
// PROSES STATUS TRANSAKSI BERDASARKAN resultCode
// resultCode: 00 = Berhasil, 01 = Pending, 02 = Gagal/Cancelled
// -----------------------------------------------------------------------
$transactionData = [
    'merchantOrderId'  => $merchantOrderId,
    'reference'        => $reference,
    'amount'           => $amount,
    'productDetail'    => $productDetail,
    'paymentCode'      => $paymentCode,
    'paymentMethod'    => $paymentMethod,
    'resultCode'       => $resultCode,
    'settledTime'      => $settledTime,
    'issuerInfo'       => $issuerInfo,
    'receiverInfo'     => $receiverInfo,
    'merchantUserId'   => $merchantUserId,
    'publisherOrderId' => $publisherOrderId,
    'spUserHash'       => $spUserHash,
    'callbackTime'     => date('Y-m-d H:i:s'),
];

switch ($resultCode) {
    case '00':
        // ✅ PEMBAYARAN BERHASIL (SUKSES / LUNAS)
        handlePaymentSuccess($transactionData);
        logCallback('PAYMENT_SUCCESS', $transactionData);
        break;

    case '01':
        // ⏳ PEMBAYARAN PENDING (Menunggu / Belum Dibayar)
        handlePaymentPending($transactionData);
        logCallback('PAYMENT_PENDING', $transactionData);
        break;

    default:
        // ❌ PEMBAYARAN GAGAL / DIBATALKAN
        handlePaymentFailed($transactionData);
        logCallback('PAYMENT_FAILED', $transactionData);
        break;
}

// Duitku mengharapkan response "SUCCESS" jika callback diterima
echo 'SUCCESS';
exit();

// -----------------------------------------------------------------------
// HANDLER FUNGSI STATUS PEMBAYARAN
// Sesuaikan dengan logika bisnis Anda (database, notifikasi, dll)
// -----------------------------------------------------------------------

/**
 * Pembayaran berhasil — tandai order sebagai LUNAS
 */
function handlePaymentSuccess(array $data) {
    // TODO: Update status order di database menjadi 'paid'
    // Contoh: UPDATE orders SET status='paid', paid_at=NOW() WHERE order_id = :merchantOrderId

    // TODO: Kirim email/WA konfirmasi ke pelanggan
    // TODO: Aktifkan layanan / generate voucher hotspot
    // Contoh sederhana: simpan ke file log sementara
}

/**
 * Pembayaran pending — order masih menunggu
 */
function handlePaymentPending(array $data) {
    // TODO: Update status order di database menjadi 'pending'
    // TODO: Kirim reminder ke pelanggan jika diperlukan
}

/**
 * Pembayaran gagal / dibatalkan
 */
function handlePaymentFailed(array $data) {
    // TODO: Update status order di database menjadi 'failed'
    // TODO: Kirim notifikasi ke admin jika diperlukan
}

/**
 * Simpan log callback ke file teks (untuk debugging & audit)
 */
function logCallback(string $event, array $data) {
    $logDir  = __DIR__ . '/logs';
    $logFile = $logDir . '/duitku_callback.log';

    // Buat folder logs jika belum ada
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }

    $entry = '[' . date('Y-m-d H:i:s') . '] [' . $event . '] ' . json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL;
    @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
}

