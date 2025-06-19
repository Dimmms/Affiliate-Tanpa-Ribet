require('dotenv').config();
const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

const core = new midtransClient.CoreApi({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

app.post('/create-transaction', async (req, res) => {
  try {
    const { name, email, order_id, amount } = req.body;

    const orderId = 'ORDER-' + Date.now();
    const startTime = new Date();

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: 45000,
      },
      customer_details: {
        first_name: name,
        email,
      },
      credit_card: { secure: true },
      expiry: {
        start_time: startTime.toISOString().slice(0, 19).replace('T', ' '),
        unit: 'hour',
        duration: 24
      }
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASS
      }
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Rincian Pemesanan - Kadar Digi',
      html: `
        <h3>Halo ${name},</h3>
        <p>Terima kasih telah melakukan pemesanan.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Total:</strong> Rp 45.000</p>
        <p><strong>Batas Waktu Pembayaran:</strong> 24 jam sejak ${startTime.toLocaleString('id-ID')}</p>
        <p>Jika butuh bantuan, hubungi admin melalui WhatsApp.</p>
      `
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error("❌ Gagal kirim email:", err);
      else console.log("✅ Email terkirim:", info.response);
    });

    res.json({ token: transaction.token, expiry_time: new Date(startTime.getTime() + 86400000).toISOString(), customer_name: name });
  } catch (error) {
    console.error('❌ Error saat membuat token:', error.message);
    res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
});

app.post('/midtrans-notification', async (req, res) => {
  try {
    console.log("📡 Webhook diterima:", req.body);
    const notif = await snap.transaction.notification(req.body);

    const {
      transaction_status,
      payment_type = '',
      gross_amount = '',
      customer_details = {},
      order_id
    } = notif;

    const nama = customer_details.first_name || '';
    const email = customer_details.email || '';
    const whatsapp = notif.whatsapp || '';

    const formData = new URLSearchParams({
      NAMA: nama,
      EMAIL: email,
      WHATSAPP: whatsapp,
      STATUS: transaction_status.toUpperCase(),
      PAYMENT_TYPE: payment_type,
      AMOUNT: gross_amount,
      ORDER_ID: order_id
    });

    await fetch('https://script.google.com/macros/s/AKfycbylcFK0K8Ex1DEpeDKiIi9YWmgafrC9M7b0og04rVwLJBpLDbHvas713WqDdYIDqTkmCQ/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    console.log("✅ Data dikirim ke Google Sheets:", formData.toString());

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASS
      }
    });

    if (transaction_status === 'pending') {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: 'Menunggu Pembayaran - Kadar Digi',
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #eee;border-radius:8px;">
            <h2 style="color:#FF6F00;">Halo ${nama},</h2>
            <p>Terima kasih telah melakukan pemesanan <strong>Paket Video Affiliate</strong>.</p>
            <hr/>
            <p><strong>🆔 Order ID:</strong> ${order_id}</p>
            <p><strong>💰 Jumlah:</strong> Rp ${gross_amount}</p>
            <p><strong>💳 Metode Pembayaran:</strong> ${payment_type.toUpperCase()}</p>
            <p>Silakan selesaikan pembayaran sesuai metode yang Anda pilih.</p>
            <hr/>
            <p style="font-size:13px;color:#777;">Butuh bantuan? Hubungi CS kami via WhatsApp.</p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('❌ Gagal kirim email status PENDING:', err);
        else console.log('✅ Email status pending terkirim:', info.response);
      });
    } else if (transaction_status === 'settlement' || transaction_status === 'capture') {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: '✅ Pembayaran Berhasil - Kadar Digi',
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #eee;border-radius:8px;">
            <h2 style="color:#2e7d32;">Pembayaran Sukses 🎉</h2>
            <p>Halo ${nama},</p>
            <p>Terima kasih atas pembelianmu di <strong>Kadar Digi</strong>.</p>
            <p><strong>Order ID:</strong> ${order_id}</p>
            <p><strong>Jumlah:</strong> Rp ${gross_amount}</p>
            <p><strong>Metode Pembayaran:</strong> ${payment_type.toUpperCase()}</p>
            <hr />
            <p><strong>📁 Akses Materi:</strong></p>
            <p><a href="https://docs.google.com/document/d/1dvzp5hXU3xl54C9zMxvPQdz9j5lLmn-w7WkB87OYh4E/edit">Klik untuk akses Google Drive</a></p>
            <p>Jika ada pertanyaan, jangan ragu untuk hubungi kami.</p>
            <p style="font-size:13px;color:#777;">Salam sukses,<br />Tim Kadar Digi</p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('❌ Gagal kirim email konfirmasi pembayaran:', err);
        else console.log('✅ Email konfirmasi pembayaran terkirim:', info.response);
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Gagal proses webhook:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/cek-status', async (req, res) => {
  const orderId = req.query.order_id;
  if (!orderId) return res.send('❌ Order ID tidak ditemukan.');

  try {
    const statusResponse = await core.transaction.status(orderId);
    const status = statusResponse.transaction_status;

    if (status === 'settlement' || status === 'capture') {
      return res.redirect('https://docs.google.com/document/d/1dvzp5hXU3xl54C9zMxvPQdz9j5lLmn-w7WkB87OYh4E/edit');
    } else if (status === 'pending') {
      return res.redirect('/pending.html');
    } else {
      return res.redirect('/error.html');
    }
  } catch (err) {
    console.error("❌ Error cek status:", err.message);
    res.send(`<p>Gagal cek status transaksi: ${err.message}</p><a href="/index.html">Kembali</a>`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server aktif di http://localhost:${PORT}`);
});
