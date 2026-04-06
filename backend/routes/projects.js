const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db/schema');

// ========================
// TEST USER ID (temporaneo)
// ========================
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';

router.get('/', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.* FROM projects p
     JOIN project_members pm ON pm.project_id=p.id
     WHERE pm.user_id=$1 ORDER BY p.created_at`,
    [req.user?.id || TEST_USER_ID]   // fallback per sicurezza
  );
  res.json(rows);
});

router.post('/', auth, async (req, res) => {
  const { name, color } = req.body;

  const { rows } = await pool.query(
    'INSERT INTO projects (name, color, owner_id) VALUES ($1,$2,$3) RETURNING *',
    [name, color || '#185FA5', TEST_USER_ID]
  );

  const project = rows[0];

  await pool.query(
    'INSERT INTO project_members (project_id, user_id) VALUES ($1,$2)',
    [project.id, TEST_USER_ID]
  );

  res.json(project);
});

router.get('/:projectId/members', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.avatar_initials, u.role
     FROM users u JOIN project_members pm ON pm.user_id=u.id
     WHERE pm.project_id=$1`,
    [req.params.projectId]
  );
  res.json(rows);
});

router.post('/:projectId/members', auth, async (req, res) => {
  const { email } = req.body;
  const { rows: userRows } = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  
  if (!userRows.length) return res.status(404).json({ error: 'Utente non trovato' });
  
  const userId = userRows[0].id;
  
  await pool.query(
    'INSERT INTO project_members (project_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [req.params.projectId, userId]
  );
  res.json({ ok: true });
});

router.get('/:projectId/epics', auth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM epics WHERE project_id=$1 ORDER BY start_month',
    [req.params.projectId]
  );
  res.json(rows);
});

router.post('/:projectId/epics', auth, async (req, res) => {
  const { name, color, start_month, duration_months } = req.body;
  
  const { rows } = await pool.query(
    'INSERT INTO epics (project_id, name, color, start_month, duration_months) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.params.projectId, name, color, start_month, duration_months]
  );
  res.json(rows[0]);
});

module.exports = router;