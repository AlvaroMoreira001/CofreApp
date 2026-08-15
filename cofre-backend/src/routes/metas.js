const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

router.post('/', asyncRoute(async (req, res) => {
  const { nome, alvo, guardado, prazo } = req.body || {};
  if (!nome || !alvo) return res.status(400).json({ erro: 'Informe nome e valor alvo' });
  const id = crypto.randomUUID();
  await pool.query('INSERT INTO metas (id, nome, alvo, guardado, prazo, cofre_id) VALUES ($1,$2,$3,$4,$5,$6)', [id, nome, alvo, guardado || 0, prazo || null, req.cofreId]);
  res.status(201).json({ id, nome, alvo, guardado: guardado || 0, prazo });
}));

router.put('/:id', asyncRoute(async (req, res) => {
  const { nome, alvo, guardado, prazo } = req.body || {};
  const r = await pool.query(
    `UPDATE metas SET nome=COALESCE($1,nome), alvo=COALESCE($2,alvo), guardado=COALESCE($3,guardado), prazo=COALESCE($4,prazo)
     WHERE id=$5 AND cofre_id=$6 RETURNING *`,
    [nome ?? null, alvo ?? null, guardado ?? null, prazo ?? null, req.params.id, req.cofreId]
  );
  if (!r.rows[0]) return res.status(404).json({ erro: 'Meta não encontrada' });
  res.json(r.rows[0]);
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM metas WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  res.status(204).end();
}));

module.exports = router;
