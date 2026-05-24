const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM diario WHERE user_id = $1 ORDER BY data DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { data, nota, besteira } = req.body;
  if (!data) return res.status(400).json({ error: 'data obrigatória' });

  try {
    const result = await pool.query(
      `INSERT INTO diario (user_id, data, nota, besteira)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, data) DO UPDATE SET nota = EXCLUDED.nota, besteira = EXCLUDED.besteira
       RETURNING *`,
      [req.user.id, data, nota || null, besteira || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
