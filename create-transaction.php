<?php
// Midtrans PHP SDK manual include
require_once(dirname(__FILE__) . '/Midtrans.php');

// SETTING MIDTRANS
Midtrans\Config::$serverKey = 'Mid-server-6HKLoF6--GxYdITeFLBOTGV-';
Midtrans\Config::$isProduction = false; // true jika sudah live
Midtrans\Config::$isSanitized = true;
Midtrans\Config::$is3ds = true;

// AMBIL DATA DARI FETCH (POST JSON)
$body = json_decode(file_get_contents("php://input"), true);

// CEK INPUT
if (!isset($body['order_id']) || !isset($body['amount'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid input. order_id dan amount wajib.']);
  exit();
}

// SET PARAMETER TRANSAKSI
$params = array(
  'transaction_details' => array(
    'order_id' => $body['order_id'],
    'gross_amount' => (int)$body['amount']
  )
);

// MINTA TOKEN KE MIDTRANS
try {
  $snapToken = Midtrans\Snap::getSnapToken($params);
  echo json_encode(['token' => $snapToken]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
?>
