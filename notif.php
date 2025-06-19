<?php
require 'mailer.php';

$raw = file_get_contents("php://input");
$serverKey = 'ISI_SERVER_KEY_KAMU';
$encoded = base64_encode($serverKey . ':');

$ch = curl_init("https://api.midtrans.com/v2/".json_decode($raw)->order_id."/status");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Basic $encoded"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$status = $data['transaction_status'];
$payment = $data['payment_type'];
$amount = $data['gross_amount'];
$email = $data['customer_details']['email'];
$name = $data['customer_details']['first_name'];
$order_id = $data['order_id'];

// Kirim ke Google Sheets
$sheet_url = "https://script.google.com/macros/s/AKfycbylcFK0K8Ex1DEpeDKiIi9YWmgafrC9M7b0og04rVwLJBpLDbHvas713WqDdYIDqTkmCQ/exec";
$data = http_build_query([
  'NAMA' => $name,
  'EMAIL' => $email,
  'STATUS' => strtoupper($status),
  'ORDER_ID' => $order_id,
  'PAYMENT_TYPE' => $payment,
  'AMOUNT' => $amount
]);
$options = ['http' => ['method' => 'POST', 'header' => "Content-type: application/x-www-form-urlencoded\r\n", 'content' => $data]];
$context = stream_context_create($options);
file_get_contents($sheet_url, false, $context);

// Kirim Email
if ($status === 'settlement' || $status === 'capture') {
  sendEmail([
    'to' => $email,
    'subject' => '✅ Pembayaran Berhasil',
    'body' => "<p>Terima kasih $name, pembayaranmu berhasil!<br><a href='https://docs.google.com/document/d/1dvzp5hXU3xl54C9zMxvPQdz9j5lLmn-w7WkB87OYh4E/edit'>Klik untuk akses materi</a></p>"
  ]);
}
