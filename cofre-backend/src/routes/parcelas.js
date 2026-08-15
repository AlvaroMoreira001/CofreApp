const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

router.post('/', asyncRoute(async (req, res) => {
  const { descricao, valor, atual, total, cartao } = req.body || {};
  if (!descricao || !valor) return res.status(400).json({ erro: 'Informe descrição e valor' });
  const id = crypto.randomUUID();
  await pool.query(
    'INSERT INTO parcelas (id, descricao, valor, atual, total, cartao, cofre_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, descricao, valor, atual || 1, total || 1, cartao || null, req.cofreId]
  );
  res.status(201).json({ id, descricao, valor, atual, total, cartao });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM parcelas WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  res.status(204).end();
}));

module.exports = router;
