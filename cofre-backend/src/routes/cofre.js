const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

router.put('/', asyncRoute(async (req, res) => {
  const { nome, renda, fechamento, tema, notificacoes } = req.body || {};
  const r = await pool.query(
    `UPDATE cofres SET
      nome = COALESCE($1, nome),
      renda = COALESCE($2, renda),
      fechamento = COALESCE($3, fechamento),
      tema = COALESCE($4, tema),
      notificacoes = COALESCE($5, notificacoes)
     WHERE id = $6 RETURNING *`,
    [nome ?? null, renda ?? null, fechamento ?? null, tema ?? null, notificacoes ?? null, req.cofreId]
  );
  res.json(r.rows[0]);
}));

router.post('/convite/gerar', asyncRoute(async (req, res) => {
  const codigo = 'COFRE-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const r = await pool.query('UPDATE cofres SET convite_codigo = $1 WHERE id = $2 RETURNING convite_codigo', [codigo, req.cofreId]);
  res.json({ conviteCodigo: r.rows[0].convite_codigo });
}));

module.exports = router;
