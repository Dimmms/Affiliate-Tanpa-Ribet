<?php
require 'mailer.php';

$name = $_POST['name'];
$email = $_POST['email'];
$whatsapp = $_POST['whatsapp'];
$order_id = 'ORDER-' . time();
$amount = 45000;

// 1. Simpan ke Google Sheets
$sheet_url = "https://script.google.com/macros/s/AKfycbylcFK0K8Ex1DEpeDKiIi9YWmgafrC9M7b0og04rVwLJBpLDbHvas713WqDdYIDqTkmCQ/exec";
$data = http_build_query([
  'NAMA' => $name,
  'EMAIL' => $email,
  'WHATSAPP' => $whatsapp,
  'STATUS' => 'MENUNGGU SNAP',
  'ORDER_ID' => $order_id
]);
$options = [
  'http' => ['header' => "Content-type: application/x-www-form-urlencoded\r\n", 'method' => 'POST', 'content' => $data]
];
$context = stream_context_create($options);
file_get_contents($sheet_url, false, $context);

// 2. Buat Snap token
$payload = [
  'transaction_details' => ['order_id' => $order_id, 'gross_amount' => $amount],
  'customer_details' => ['first_name' => $name, 'email' => $email],
  'credit_card' => ['secure' => true],
  'expiry' => [
    'start_time' => date("Y-m-d H:i:s O"),
    'unit' => 'hour',
    'duration' => 24
  ]
];

$serverKey = 'ISI_SERVER_KEY_KAMU';
$encoded = base64_encode($serverKey . ':');
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://app.midtrans.com/snap/v1/transactions");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json", "Authorization: Basic $encoded"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
$result = json_decode($response, true);

// 3. Kirim Email
sendEmail([
  'to' => $email,
  'subject' => 'Rincian Pemesanan',
  'body' => "<h3>Halo $name,</h3><p>Order ID: $order_id<br>Total: Rp45.000<br>Silakan lanjutkan pembayaran menggunakan Midtrans Snap.</p>"
]);

// 4. Return JSON
header('Content-Type: application/json');
echo json_encode(['token' => $result['token'], 'order_id' => $order_id]);
