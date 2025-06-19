// app.js
const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/paymentRoutes');
require('dotenv').config();

const app = express();

// ✅ Setup CORS agar bisa dari localhost & domain live
app.use(cors({
  origin: ['http://localhost:3000', 'https://affiliatetanparibet.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.static('public'));

// ✅ Routing
app.use('/', paymentRoutes);

module.exports = app;
