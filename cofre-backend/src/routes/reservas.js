const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

// Guarda um valor (opcionalmente vinculado a uma meta — se vinculado, soma no "guardado" dela).
router.post('/', asyncRoute(async (req, res) => {
  const { valor, nota, metaId } = req.body || {};
  const v = Number(valor);
  if (!v || v <= 0) return res.status(400).json({ erro: 'Informe um valor maior que zero' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (metaId) {
      const meta = await client.query('SELECT id, alvo, guardado FROM metas WHERE id = $1 AND cofre_id = $2', [metaId, req.cofreId]);
      if (!meta.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ erro: 'Meta não encontrada' }); }
      const novoGuardado = Math.min(Number(meta.rows[0].alvo), Number(meta.rows[0].guardado) + v);
      await client.query('UPDATE metas SET guardado = $1 WHERE id = $2', [novoGuardado, metaId]);
    }
    const id = crypto.randomUUID();
    await client.query(
      'INSERT INTO reservas (id, valor, nota, meta_id, cofre_id) VALUES ($1,$2,$3,$4,$5)',
      [id, v, nota || null, metaId || null, req.cofreId]
    );
    await client.query('COMMIT');
    res.status(201).json({ id, valor: v, nota, metaId });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query('SELECT valor, meta_id FROM reservas WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
    if (!r.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ erro: 'Registro não encontrado' }); }
    const { valor, meta_id } = r.rows[0];
    if (meta_id) {
      const meta = await client.query('SELECT guardado FROM metas WHERE id = $1', [meta_id]);
      if (meta.rows[0]) {
        const novoGuardado = Math.max(0, Number(meta.rows[0].guardado) - Number(valor));
        await client.query('UPDATE metas SET guardado = $1 WHERE id = $2', [novoGuardado, meta_id]);
      }
    }
    await client.query('DELETE FROM reservas WHERE id = $1 AND cofre_id = $2', [req.params.id, req.cofreId]);
    await client.query('COMMIT');
    res.status(204).end();
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

module.exports = router;
