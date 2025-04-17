require('dotenv').config();

const express = require('express');
const mysql   = require('mysql2/promise');
const crypto  = require('crypto');          // SHA‑256 hashing :contentReference[oaicite:0]{index=0}
const jwt     = require('jsonwebtoken');    // JWT issuance :contentReference[oaicite:1]{index=1}
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── MySQL pool ────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

// Hash helper using SHA‑256
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Generate a short‑lived JWT for password reset
function generateResetToken(username) {
  return jwt.sign(
    { username, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// ── Registration ─────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hash = sha256(password);
    await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hash]
    );
    res.json({ message: 'Registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Login ────────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(
      'SELECT username, password FROM users WHERE username = ?',
      [username]
    );

    if (!rows.length || sha256(password) !== rows[0].password) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Forgot Password ──────────────────────────────────────────────────────────
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const [rows] = await pool.query(
      'SELECT username FROM users WHERE username = ?',
      [username]
    );

    // Prepare resetLink only if user exists
    let resetLink = null;
    if (rows.length) {
      const token = generateResetToken(username);
      resetLink  = `http://localhost:3000/reset-password?token=${token}`;
      console.log(`🔗 Password reset link for ${username}: ${resetLink}`);
    }

    res.json({
      message: 'If that account exists, you’ll receive a reset link shortly.',
      resetLink
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reset Password ───────────────────────────────────────────────────────────
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token.' });
    }

    const hash = sha256(password);
    await pool.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hash, payload.username]
    );
    res.json({ message: 'Password has been reset.' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token.' });
  }
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
