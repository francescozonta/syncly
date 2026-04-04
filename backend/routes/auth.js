const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/schema');

const makeInitials = (name) =>
  name.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const initials = makeInitials(name);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, avatar_initials) VALUES ($1,$2,$3,$4) RETURNING id, name, email, avatar_initials, role',
      [name, email, hash, initials]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email già registrata' });
    console.error(e);
    res.status(500).json({ error: 'Errore server' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Credenziali errate' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore server' });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, avatar_initials, role, created_at FROM users WHERE id=$1',
    [req.user.id]
  );
  res.json(rows[0] || null);
});

module.exports = router;
