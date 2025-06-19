<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'vendor/autoload.php';

function sendEmail($params) {
  $mail = new PHPMailer(true);
  try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'EMAIL_KAMU@gmail.com';
    $mail->Password = 'APP_PASSWORD';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    $mail->setFrom('EMAIL_KAMU@gmail.com', 'Kadar Digi');
    $mail->addAddress($params['to']);
    $mail->isHTML(true);
    $mail->Subject = $params['subject'];
    $mail->Body = $params['body'];
    $mail->send();
  } catch (Exception $e) {
    error_log("Mailer Error: {$mail->ErrorInfo}");
  }
}
