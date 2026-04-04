const router = require('express').Router();
const auth = require('../middleware/auth');
const { pool } = require('../db/schema');

router.get('/:projectId', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, u.name as author_name, u.avatar_initials,
      EXISTS(SELECT 1 FROM idea_votes v WHERE v.idea_id=i.id AND v.user_id=$2) as voted
     FROM ideas i LEFT JOIN users u ON u.id=i.author_id
     WHERE i.project_id=$1 ORDER BY i.created_at DESC`,
    [req.params.projectId, req.user.id]
  );
  res.json(rows);
});

router.post('/:projectId', auth, async (req, res) => {
  const { text, category, color } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO ideas (project_id, author_id, text, category, color) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.params.projectId, req.user.id, text, category, color]
  );
  res.json(rows[0]);
});

router.post('/:ideaId/vote', auth, async (req, res) => {
  const { ideaId } = req.params;
  const userId = req.user.id;
  try {
    await pool.query('INSERT INTO idea_votes (idea_id, user_id) VALUES ($1,$2)', [ideaId, userId]);
    await pool.query('UPDATE ideas SET votes = votes + 1 WHERE id=$1', [ideaId]);
    const { rows } = await pool.query('SELECT votes FROM ideas WHERE id=$1', [ideaId]);
    res.json({ votes: rows[0].votes, voted: true });
  } catch {
    await pool.query('DELETE FROM idea_votes WHERE idea_id=$1 AND user_id=$2', [ideaId, userId]);
    await pool.query('UPDATE ideas SET votes = GREATEST(votes - 1, 0) WHERE id=$1', [ideaId]);
    const { rows } = await pool.query('SELECT votes FROM ideas WHERE id=$1', [ideaId]);
    res.json({ votes: rows[0].votes, voted: false });
  }
});

router.delete('/:ideaId', auth, async (req, res) => {
  await pool.query('DELETE FROM ideas WHERE id=$1 AND author_id=$2', [req.params.ideaId, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
