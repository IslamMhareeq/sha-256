// backend/index.js
require('dotenv').config(); // Load environment variables

const express = require('express');
const mysql   = require('mysql2/promise');
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── MySQL pool ────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST,     
  user:     process.env.DB_USER,     
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,     // "app"
});

// ── Helpers ───────────────────────────────────────────────────────────────────
// SHA-256 helper
const sha256 = str => crypto.createHash('sha256').update(str).digest('hex');

// JWT reset-link generator
function generateResetToken(username) {
  return jwt.sign(
    { username, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// Auth middleware
function authenticateToken(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ── 1) REGISTER ───────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const {
      username, password, role = 'user',
      first_name, last_name, id_number,
      credit_card_number, valid_date, cvc
    } = req.body;

    // Reject any quotes or comment markers in password inputs
    if (/[\'\-]/.test(password)) {
      return res.status(400).json({ error: 'Password contains invalid characters.' });
    }

    const hash = sha256(password);
    await pool.execute(
      `INSERT INTO userse
         (username, password, role,
          first_name, last_name, id_number,
          credit_card_number, valid_date, cvc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, hash, role,
       first_name, last_name, id_number,
       credit_card_number, valid_date, cvc]
    );

    res.json({ message: 'Registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 2) LOGIN ───────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username = '', password = '' } = req.body;

    // Reject SQL‐injection characters in password
    if (password && /[\'\-]/.test(password)) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Build parameterized query; skip password check if blank
    let sql    = 'SELECT username, role, password FROM userse WHERE username = ?';
    const args = [username];

    if (password) {
      sql  += ' AND password = ?';
      args.push(sha256(password));
    }

    const [rows] = await pool.execute(sql, args);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user  = rows[0];
    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 3) FORGOT PASSWORD ─────────────────────────────────────────────────────────
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const [rows] = await pool.execute(
      'SELECT 1 FROM userse WHERE username = ?', [username]
    );

    let resetLink = null;
    if (rows.length) {
      const token = generateResetToken(username);
      resetLink  = `http://localhost:3000/reset-password?token=${token}`;
      console.log(`🔗 Reset link for ${username}: ${resetLink}`);
    }

    res.json({
      message: 'If that account exists, you’ll receive a reset link shortly.',
      resetLink
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 4) RESET PASSWORD ──────────────────────────────────────────────────────────
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== 'password_reset' || /[\'\-]/.test(password)) {
      return res.status(400).json({ error: 'Invalid token or password.' });
    }
    const hash = sha256(password);
    await pool.execute(
      'UPDATE userse SET password = ? WHERE username = ?',
      [hash, payload.username]
    );
    res.json({ message: 'Password has been reset.' });
  } catch {
    res.status(400).json({ error: 'Invalid or expired token.' });
  }
});

// ── 5) LIST USERS (ADMIN ONLY) ────────────────────────────────────────────────
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);

  const [rows] = await pool.execute(`
    SELECT username, role, first_name, last_name,
           id_number, credit_card_number, valid_date, cvc
      FROM userse
  `);
  res.json(rows);
});

// ── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
