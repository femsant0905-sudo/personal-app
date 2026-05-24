const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pressoes WHERE user_id = $1 ORDER BY data DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { data, manha, noite } = req.body;
  if (!data) return res.status(400).json({ error: 'data obrigatória' });

  try {
    const result = await pool.query(
      `INSERT INTO pressoes (user_id, data, manha, noite)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, data) DO UPDATE SET manha = EXCLUDED.manha, noite = EXCLUDED.noite
       RETURNING *`,
      [req.user.id, data, manha || null, noite || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
