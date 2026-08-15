const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

router.post('/', asyncRoute(async (req, res) => {
  const { descricao, cat, val, data, origem, formaPagamento, nota, foto } = req.body || {};
  if (!descricao || !cat || val == null || !data) return res.status(400).json({ erro: 'Preencha descrição, categoria, valor e data' });
  const id = crypto.randomUUID();
  await pool.query(
    'INSERT INTO transacoes (id, descricao, cat, val, data, origem, forma_pagamento, nota, foto, cofre_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [id, descricao, cat, val, data, origem || null, formaPagamento || null, nota || null, foto || null, req.cofreId]
  );
  res.status(201).json({ id, descricao, cat, val, data, origem, formaPagamento, nota, foto });
}));

router.put('/:id', asyncRoute(async (req, res) => {
  const { descricao, cat, val, data, origem, formaPagamento, nota, foto } = req.body || {};
  const r = await pool.query(
    `UPDATE transacoes SET descricao=$1, cat=$2, val=$3, data=$4, origem=$5, forma_pagamento=$6, nota=$7, foto=$8
     WHERE id=$9 AND cofre_id=$10 RETURNING id`,
    [descricao, cat, val, data, origem || null, formaPagamento || null, nota || null, foto || null, req.params.id, req.cofreId]
  );
  if (!r.rows[0]) return res.status(404).json({ erro: 'Lançamento não encontrado' });
  res.json({ ok: true });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM transacoes WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  res.status(204).end();
}));

module.exports = router;
