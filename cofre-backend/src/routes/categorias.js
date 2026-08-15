const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

router.post('/', asyncRoute(async (req, res) => {
  const { nome, cor } = req.body || {};
  if (!nome || !cor) return res.status(400).json({ erro: 'Informe nome e cor' });
  const existe = await pool.query('SELECT id FROM categorias WHERE cofre_id = $1 AND nome = $2', [req.cofreId, nome]);
  if (existe.rows.length) return res.status(409).json({ erro: 'Categoria já existe' });
  const id = crypto.randomUUID();
  await pool.query('INSERT INTO categorias (id, nome, cor, cofre_id) VALUES ($1,$2,$3,$4)', [id, nome, cor, req.cofreId]);
  res.status(201).json({ id, nome, cor });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const cat = await pool.query('SELECT nome FROM categorias WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  if (!cat.rows[0]) return res.status(404).json({ erro: 'Categoria não encontrada' });
  const emUso = await pool.query('SELECT 1 FROM transacoes WHERE cofre_id = $1 AND cat = $2 LIMIT 1', [req.cofreId, cat.rows[0].nome]);
  if (emUso.rows.length) return res.status(409).json({ erro: 'Categoria em uso — não pode ser removida' });
  await pool.query('DELETE FROM categorias WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  res.status(204).end();
}));

module.exports = router;
