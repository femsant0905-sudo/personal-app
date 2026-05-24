const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/:data', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dieta WHERE user_id = $1 AND data = $2',
      [req.user.id, req.params.data]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { data, refeicao_id, concluida, opcao_idx } = req.body;
  if (!data || refeicao_id === undefined) return res.status(400).json({ error: 'data e refeicao_id obrigatórios' });

  try {
    const result = await pool.query(
      `INSERT INTO dieta (user_id, data, refeicao_id, concluida, opcao_idx)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, data, refeicao_id) DO UPDATE SET concluida = EXCLUDED.concluida, opcao_idx = EXCLUDED.opcao_idx
       RETURNING *`,
      [req.user.id, data, refeicao_id, concluida ?? false, opcao_idx ?? 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
