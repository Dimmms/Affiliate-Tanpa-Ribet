// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();

// Import controller functions
const {
  createTransaction,
  handleNotification,
  checkStatus
} = require('../controllers/midtransController');

// ⬇️ Buat transaksi baru (Snap token)
router.post('/create-transaction', createTransaction);

// ⬇️ Webhook Midtrans (dipanggil otomatis oleh server Midtrans)
router.post('/midtrans-notification', handleNotification);

// ⬇️ Cek status order → redirect berdasarkan hasilnya
router.get('/cek-status', checkStatus);

module.exports = router;
