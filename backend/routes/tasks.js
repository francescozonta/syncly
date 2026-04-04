const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db/schema');

router.get('/:projectId', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.name as assignee_name, u.avatar_initials
     FROM tasks t LEFT JOIN users u ON u.id=t.assignee_id
     WHERE t.project_id=$1 ORDER BY t.created_at DESC`,
    [req.params.projectId]
  );
  res.json(rows);
});

router.post('/:projectId', auth, async (req, res) => {
  const { title, status, tag, assignee_id, due_date } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO tasks (project_id, title, status, tag, assignee_id, due_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.params.projectId, title, status || 'todo', tag, assignee_id || null, due_date || null]
  );
  res.json(rows[0]);
});

router.patch('/:taskId', auth, async (req, res) => {
  const { status, title, tag, assignee_id, due_date } = req.body;
  const { rows } = await pool.query(
    `UPDATE tasks SET
      status = COALESCE($1, status),
      title = COALESCE($2, title),
      tag = COALESCE($3, tag),
      assignee_id = COALESCE($4, assignee_id),
      due_date = COALESCE($5, due_date)
     WHERE id=$6 RETURNING *`,
    [status, title, tag, assignee_id, due_date, req.params.taskId]
  );
  res.json(rows[0]);
});

router.delete('/:taskId', auth, async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.taskId]);
  res.json({ ok: true });
});

module.exports = router;
