const midtransClient = require('midtrans-client');
const fetch = require('node-fetch');
const sendEmail = require('../helpers/mailer');

const snap = new midtransClient.Snap({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

const core = new midtransClient.CoreApi({
  isProduction: true,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

exports.createTransaction = async (req, res) => {
  try {
     console.log("POST /create-transaction diterima"); // ✅ Tambahkan di sini
    const { name, email, whatsapp } = req.body;
    const orderId = 'ORDER-' + Date.now();
    const startTime = new Date();

    const formData = new URLSearchParams({
      NAMA: name,
      EMAIL: email,
      WHATSAPP: whatsapp,
      STATUS: 'MENUNGGU SNAP',
      ORDER_ID: orderId
    });

    await fetch('https://script.google.com/macros/s/AKfycbylcFK0K8Ex1DEpeDKiIi9YWmgafrC9M7b0og04rVwLJBpLDbHvas713WqDdYIDqTkmCQ/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: 45000
      },
      customer_details: {
        first_name: name,
        email
      },
      credit_card: { secure: true },
      expiry: {
        start_time: startTime.toISOString().slice(0, 19).replace('T', ' '),
        unit: 'hour',
        duration: 24
      }
    });

    await sendEmail({
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
    });

    res.json({
      token: transaction.token,
      expiry_time: new Date(startTime.getTime() + 86400000).toISOString(),
      customer_name: name
    });

  } catch (error) {
    console.error('❌ Gagal membuat transaksi:', error.message);
    res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
};

exports.handleNotification = async (req, res) => {
  try {
    const notif = await snap.transaction.notification(req.body);

    const {
      transaction_status,
      payment_type = '',
      gross_amount = '',
      order_id,
      customer_details = {}
    } = notif;

    const name = customer_details.first_name || '';
    const email = customer_details.email || '';
    const whatsapp = req.body.whatsapp || '';

    const formData = new URLSearchParams({
      NAMA: name,
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

    let mailOptions;

    if (transaction_status === 'pending') {
      mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: 'Menunggu Pembayaran - Kadar Digi',
        html: `
          <h3>Halo ${name},</h3>
          <p>Terima kasih atas pesananmu.</p>
          <p><strong>Order ID:</strong> ${order_id}</p>
          <p><strong>Jumlah:</strong> Rp ${gross_amount}</p>
          <p><strong>Metode:</strong> ${payment_type.toUpperCase()}</p>
          <p>Status: <strong>MENUNGGU PEMBAYARAN</strong></p>
        `
      };
    } else if (transaction_status === 'settlement' || transaction_status === 'capture') {
      mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: '✅ Pembayaran Berhasil - Kadar Digi',
        html: `
          <h3>Terima kasih ${name},</h3>
          <p>✅ Pembayaranmu telah berhasil.</p>
          <p><strong>Order ID:</strong> ${order_id}</p>
          <p><strong>Materi:</strong> <a href="https://docs.google.com/document/d/1dvzp5hXU3xl54C9zMxvPQdz9j5lLmn-w7WkB87OYh4E/edit">Klik untuk akses materi</a></p>
        `
      };
    }

    if (mailOptions) {
      await sendEmail(mailOptions);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Gagal memproses notifikasi:', error.message);
    res.status(500).send('Gagal proses notifikasi');
  }
};

exports.checkStatus = async (req, res) => {
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
    console.error("❌ Gagal cek status:", err.message);
    res.send(`<p>Gagal cek status transaksi: ${err.message}</p><a href="/index.html">Kembali</a>`);
  }
};
