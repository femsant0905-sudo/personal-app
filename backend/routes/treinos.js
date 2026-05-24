const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const treinos = await pool.query(
      'SELECT * FROM treinos WHERE user_id = $1 ORDER BY data DESC',
      [req.user.id]
    );
    const series = await pool.query(
      'SELECT ts.* FROM treino_series ts JOIN treinos t ON ts.treino_id = t.id WHERE t.user_id = $1',
      [req.user.id]
    );

    const seriesByTreino = {};
    series.rows.forEach(s => {
      if (!seriesByTreino[s.treino_id]) seriesByTreino[s.treino_id] = [];
      seriesByTreino[s.treino_id].push(s);
    });

    const result = treinos.rows.map(t => ({ ...t, series: seriesByTreino[t.id] || [] }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { data, dia, duracao, gasto, series } = req.body;
  if (!data || !dia) return res.status(400).json({ error: 'data e dia obrigatórios' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const treino = await client.query(
      `INSERT INTO treinos (user_id, data, dia, duracao, gasto)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, data, dia) DO UPDATE SET duracao = EXCLUDED.duracao, gasto = EXCLUDED.gasto
       RETURNING *`,
      [req.user.id, data, dia, duracao || null, gasto || null]
    );

    const treinoId = treino.rows[0].id;

    if (series && series.length > 0) {
      await client.query('DELETE FROM treino_series WHERE treino_id = $1', [treinoId]);
      for (const s of series) {
        await client.query(
          'INSERT INTO treino_series (treino_id, exercicio, serie_num, kg, reps, comentario) VALUES ($1, $2, $3, $4, $5, $6)',
          [treinoId, s.exercicio, s.serie_num, s.kg || null, s.reps || null, s.comentario || null]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ ...treino.rows[0], series: series || [] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
