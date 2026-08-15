const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

// Cria ou atualiza (upsert por categoria dentro do mesmo cofre).
router.post('/', asyncRoute(async (req, res) => {
  const { cat, limite } = req.body || {};
  if (!cat || !limite || limite <= 0) return res.status(400).json({ erro: 'Informe categoria e limite válido' });
  const r = await pool.query(
    `INSERT INTO orcamentos (id, cat, limite, cofre_id) VALUES ($1,$2,$3,$4)
     ON CONFLICT (cofre_id, cat) DO UPDATE SET limite = EXCLUDED.limite
     RETURNING id, cat, limite`,
    [crypto.randomUUID(), cat, limite, req.cofreId]
  );
  res.status(201).json(r.rows[0]);
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM orcamentos WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  res.status(204).end();
}));

module.exports = router;
