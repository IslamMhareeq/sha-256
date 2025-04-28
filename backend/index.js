// backend/index.js
require('dotenv').config(); // 1) Load .env first

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
  host:     process.env.DB_HOST,     // e.g. localhost
  user:     process.env.DB_USER,     // e.g. root
  password: process.env.DB_PASSWORD, // your MySQL password
  database: process.env.DB_NAME,     // must be "app"
});

// ── Helpers ───────────────────────────────────────────────────────────────────
// SHA-256 helper
const sha256 = str => crypto.createHash('sha256').update(str).digest('hex');

// JWT for reset links
function generateResetToken(username) {
  return jwt.sign(
    { username, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;  // { username, role, iat, exp }
    next();
  });
}

// ── 1) REGISTER ───────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  try {
    const {
      username,
      password,
      role = 'user',
      first_name,
      last_name,
      id_number,
      credit_card_number,
      valid_date,
      cvc
    } = req.body;

    const hash = sha256(password);
    await pool.query(
      `INSERT INTO userse
        (username, password, role,
         first_name, last_name, id_number,
         credit_card_number, valid_date, cvc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username, hash, role,
        first_name, last_name, id_number,
        credit_card_number, valid_date, cvc
      ]
    );

    res.json({ message: 'Registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/// ── 2) LOGIN (INJECTION DEMO: "admin' --") ───────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    let { username = '', password = '' } = req.body;

    // Detect injection marker "--" and strip off everything from it onward,
    // then trim any trailing single-quote.
    if (username.includes('--')) {
      username = username
        .split('--')[0]    // take left side of "--"
        .trim()            // remove spaces
        .replace(/'$/, ''); // drop trailing apostrophe
    }

    // Build insecure SQL: if password is blank, skip that check entirely.
    let sql = "SELECT username, role FROM userse WHERE username = '" + username + "'";
    if (password) {
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      sql += " AND password = '" + hash + "'";
    }

    const [rows] = await pool.query(sql);

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
    const [rows] = await pool.query(
      'SELECT 1 FROM userse WHERE username = ?',
      [username]
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

    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token.' });
    }

    const hash = sha256(password);
    await pool.query(
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
  if (req.user.role !== 'admin') {
    return res.sendStatus(403);
  }

  try {
    const [rows] = await pool.query(`
      SELECT
        username, role, first_name, last_name,
        id_number, credit_card_number, valid_date, cvc
      FROM userse
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
