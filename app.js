const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/paymentRoutes');
require('dotenv').config();

const app = express();

// ✅ 1. Pasang middleware CORS global
app.use(cors({
  origin: ['http://localhost:3000', 'https://affiliatetanparibet.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// ✅ 2. Tangani preflight request secara eksplisit (opsional tapi aman)
app.options('*', cors());

app.use(express.json());
app.use(express.static('public'));

// ✅ Routing utama
app.use('/', paymentRoutes);

module.exports = app;
