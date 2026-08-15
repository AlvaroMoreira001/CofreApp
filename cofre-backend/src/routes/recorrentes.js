const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

router.post('/', asyncRoute(async (req, res) => {
  const { nome, valor, dia, cat } = req.body || {};
  if (!nome || !valor) return res.status(400).json({ erro: 'Informe nome e valor' });
  const id = crypto.randomUUID();
  await pool.query('INSERT INTO recorrentes (id, nome, valor, dia, cat, ativo, cofre_id) VALUES ($1,$2,$3,$4,$5,TRUE,$6)', [id, nome, valor, dia || 1, cat || null, req.cofreId]);
  res.status(201).json({ id, nome, valor, dia, cat, ativo: true });
}));

router.put('/:id', asyncRoute(async (req, res) => {
  const { nome, valor, dia, cat, ativo } = req.body || {};
  const r = await pool.query(
    `UPDATE recorrentes SET nome=COALESCE($1,nome), valor=COALESCE($2,valor), dia=COALESCE($3,dia),
      cat=COALESCE($4,cat), ativo=COALESCE($5,ativo)
     WHERE id=$6 AND cofre_id=$7 RETURNING *`,
    [nome ?? null, valor ?? null, dia ?? null, cat ?? null, ativo ?? null, req.params.id, req.cofreId]
  );
  if (!r.rows[0]) return res.status(404).json({ erro: 'Conta recorrente não encontrada' });
  res.json(r.rows[0]);
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM recorrentes WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  res.status(204).end();
}));

module.exports = router;
