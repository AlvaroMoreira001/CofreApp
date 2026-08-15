const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

async function garantirGrupoDoCofre(grupoId, cofreId) {
  const r = await pool.query('SELECT id FROM grupos WHERE id = $1 AND cofre_id = $2', [grupoId, cofreId]);
  return !!r.rows[0];
}

router.post('/', asyncRoute(async (req, res) => {
  const { nome } = req.body || {};
  if (!nome) return res.status(400).json({ erro: 'Informe o nome do grupo' });
  const usuarioR = await pool.query('SELECT nome FROM usuarios WHERE id = $1', [req.usuarioId]);
  const id = crypto.randomUUID();
  await pool.query('INSERT INTO grupos (id, nome, cofre_id) VALUES ($1,$2,$3)', [id, nome, req.cofreId]);
  const pessoaId = crypto.randomUUID();
  await pool.query('INSERT INTO grupo_pessoas (id, nome, usuario_id, grupo_id) VALUES ($1,$2,$3,$4)', [pessoaId, usuarioR.rows[0].nome, req.usuarioId, id]);
  res.status(201).json({ id, nome, pessoas: [{ id: pessoaId, nome: usuarioR.rows[0].nome, souEu: true }], despesas: [] });
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM grupos WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
  res.status(204).end();
}));

router.post('/:id/pessoas', asyncRoute(async (req, res) => {
  if (!(await garantirGrupoDoCofre(req.params.id, req.cofreId))) return res.status(404).json({ erro: 'Grupo não encontrado' });
  const { nome } = req.body || {};
  if (!nome) return res.status(400).json({ erro: 'Informe o nome' });
  const id = crypto.randomUUID();
  await pool.query('INSERT INTO grupo_pessoas (id, nome, grupo_id) VALUES ($1,$2,$3)', [id, nome, req.params.id]);
  res.status(201).json({ id, nome, souEu: false });
}));

router.delete('/:id/pessoas/:pessoaId', asyncRoute(async (req, res) => {
  if (!(await garantirGrupoDoCofre(req.params.id, req.cofreId))) return res.status(404).json({ erro: 'Grupo não encontrado' });
  await pool.query('DELETE FROM grupo_pessoas WHERE id = $1 AND grupo_id = $2', [req.params.pessoaId, req.params.id]);
  res.status(204).end();
}));

router.post('/:id/despesas', asyncRoute(async (req, res) => {
  if (!(await garantirGrupoDoCofre(req.params.id, req.cofreId))) return res.status(404).json({ erro: 'Grupo não encontrado' });
  const { descricao, valor, pagadorId, pagadorNome, data } = req.body || {};
  if (!descricao || !valor) return res.status(400).json({ erro: 'Informe descrição e valor' });
  const id = crypto.randomUUID();
  await pool.query(
    'INSERT INTO grupo_despesas (id, descricao, valor, pagador_id, pagador_nome, data, grupo_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [id, descricao, valor, pagadorId || null, pagadorId ? null : (pagadorNome || null), data || new Date().toISOString().slice(0, 10), req.params.id]
  );
  res.status(201).json({ id, descricao, valor, pagador: pagadorId, pagadorNome });
}));

router.delete('/:id/despesas/:despesaId', asyncRoute(async (req, res) => {
  if (!(await garantirGrupoDoCofre(req.params.id, req.cofreId))) return res.status(404).json({ erro: 'Grupo não encontrado' });
  await pool.query('DELETE FROM grupo_despesas WHERE id = $1 AND grupo_id = $2', [req.params.despesaId, req.params.id]);
  res.status(204).end();
}));

module.exports = router;
