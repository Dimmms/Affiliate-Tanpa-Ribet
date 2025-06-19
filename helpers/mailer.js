// helpers/mailer.js
const nodemailer = require('nodemailer');

// 🔧 Konfigurasi transporter Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASS
  }
});

/**
 * Fungsi kirim email reusable
 * @param {Object} mailOptions - dari controller: { from, to, subject, html/text }
 */
const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email terkirim:', info.response);
  } catch (err) {
    console.error('❌ Gagal kirim email:', err);
  }
};

module.exports = sendEmail;
