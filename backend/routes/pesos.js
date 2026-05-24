const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pesos WHERE user_id = $1 ORDER BY data DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { data, peso } = req.body;
  if (!data || !peso) return res.status(400).json({ error: 'data e peso obrigatórios' });

  try {
    const result = await pool.query(
      `INSERT INTO pesos (user_id, data, peso)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, data) DO UPDATE SET peso = EXCLUDED.peso
       RETURNING *`,
      [req.user.id, data, peso]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
