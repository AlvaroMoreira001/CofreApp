const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

router.post('/', asyncRoute(async (req, res) => {
  const { nome, final, fatura, fecha, limiteTotal, tom } = req.body || {};
  if (!nome) return res.status(400).json({ erro: 'Informe o nome do cartão' });
  const id = crypto.randomUUID();
  await pool.query(
    'INSERT INTO cartoes (id, nome, final, fatura, fecha, limite_total, tom, cofre_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, nome, final || '0000', fatura || 0, fecha || '1', limiteTotal || 1, tom || '#242a48', req.cofreId]
  );
  res.status(201).json({ id, nome, final, fatura, fecha, limiteTotal, tom });
}));

router.put('/:id', asyncRoute(async (req, res) => {
  const { nome, final, fatura, fecha, limiteTotal, tom } = req.body || {};
  const r = await pool.query(
    `UPDATE cartoes SET nome=COALESCE($1,nome), final=COALESCE($2,final), fatura=COALESCE($3,fatura),
      fecha=COALESCE($4,fecha), limite_total=COALESCE($5,limite_total), tom=COALESCE($6,tom)
     WHERE id=$7 AND cofre_id=$8 RETURNING *`,
    [nome ?? null, final ?? null, fatura ?? null, fecha ?? null, limiteTotal ?? null, tom ?? null, req.params.id, req.cofreId]
  );
  if (!r.rows[0]) return res.status(404).json({ erro: 'Cartão não encontrado' });
  res.json(r.rows[0]);
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM cartoes WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  res.status(204).end();
}));

module.exports = router;
