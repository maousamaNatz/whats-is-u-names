const mysql = require("mysql2");
require("dotenv").config();

// Buat koneksi ke MySQL menggunakan variabel lingkungan
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Sesuaikan sesuai kebutuhan
  queueLimit: 0
});

module.exports = db;