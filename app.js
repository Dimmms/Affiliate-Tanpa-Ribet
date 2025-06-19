// app.js
const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/paymentRoutes');
require('dotenv').config();

const app = express();

// ✅ Logging semua request (GET, POST, dst.)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ✅ Setup CORS agar bisa diakses dari localhost & domain live
app.use(cors({
  origin: ['http://localhost:3000', 'https://affiliatetanparibet.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ✅ Parsing JSON & Static File
app.use(express.json());
app.use(express.static('public'));

// ✅ Routing
app.use('/', paymentRoutes);

module.exports = app;
