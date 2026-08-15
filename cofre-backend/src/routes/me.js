const express = require('express');
const { pool } = require('../db');
const { autenticar } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();
router.use(autenticar);

router.get('/', asyncRoute(async (req, res) => {
  const { usuarioId, cofreId } = req;

  const [usuario, cofre, categorias, transacoes, orcamentos, metas, cartoes, parcelas, recorrentes, grupos, pessoas, despesas, reservas] = await Promise.all([
    pool.query('SELECT id, email, nome, foto, cofre_id FROM usuarios WHERE id = $1', [usuarioId]),
    pool.query('SELECT * FROM cofres WHERE id = $1', [cofreId]),
    pool.query('SELECT id, nome, cor FROM categorias WHERE cofre_id = $1 ORDER BY nome', [cofreId]),
    pool.query('SELECT id, descricao, cat, val, data, origem, forma_pagamento, nota, foto FROM transacoes WHERE cofre_id = $1 ORDER BY data DESC', [cofreId]),
    pool.query('SELECT id, cat, limite FROM orcamentos WHERE cofre_id = $1', [cofreId]),
    pool.query('SELECT id, nome, alvo, guardado, prazo FROM metas WHERE cofre_id = $1', [cofreId]),
    pool.query('SELECT id, nome, final, fatura, fecha, limite_total, tom FROM cartoes WHERE cofre_id = $1', [cofreId]),
    pool.query('SELECT id, descricao, valor, atual, total, cartao FROM parcelas WHERE cofre_id = $1', [cofreId]),
    pool.query('SELECT id, nome, valor, dia, cat, ativo FROM recorrentes WHERE cofre_id = $1', [cofreId]),
    pool.query('SELECT id, nome FROM grupos WHERE cofre_id = $1', [cofreId]),
    pool.query('SELECT gp.id, gp.nome, gp.usuario_id, gp.grupo_id FROM grupo_pessoas gp JOIN grupos g ON g.id = gp.grupo_id WHERE g.cofre_id = $1', [cofreId]),
    pool.query('SELECT gd.id, gd.descricao, gd.valor, gd.pagador_id, gd.pagador_nome, gd.data, gd.grupo_id FROM grupo_despesas gd JOIN grupos g ON g.id = gd.grupo_id WHERE g.cofre_id = $1 ORDER BY gd.data DESC', [cofreId]),
    pool.query('SELECT id, valor, nota, meta_id, created_at FROM reservas WHERE cofre_id = $1 ORDER BY created_at DESC', [cofreId]),
  ]);

  if (!usuario.rows[0] || !cofre.rows[0]) return res.status(404).json({ erro: 'Conta não encontrada' });

  const gruposComPessoas = grupos.rows.map(g => ({
    id: g.id,
    nome: g.nome,
    pessoas: pessoas.rows.filter(p => p.grupo_id === g.id).map(p => ({ id: p.id, nome: p.nome, souEu: p.usuario_id === usuarioId })),
    despesas: despesas.rows.filter(d => d.grupo_id === g.id).map(d => ({
      id: d.id, descricao: d.descricao, valor: Number(d.valor),
      pagador: d.pagador_id, pagadorNome: d.pagador_nome, data: d.data,
    })),
  }));

  res.json({
    usuario: usuario.rows[0],
    cofre: {
      id: cofre.rows[0].id,
      nome: cofre.rows[0].nome,
      renda: Number(cofre.rows[0].renda),
      fechamento: cofre.rows[0].fechamento,
      tema: cofre.rows[0].tema,
      notificacoes: cofre.rows[0].notificacoes,
      conviteCodigo: cofre.rows[0].convite_codigo,
    },
    categorias: categorias.rows,
    transacoes: transacoes.rows.map(t => ({ ...t, val: Number(t.val), data: fmtDate(t.data), formaPagamento: t.forma_pagamento })),
    orcamentos: orcamentos.rows.map(o => ({ ...o, limite: Number(o.limite) })),
    metas: metas.rows.map(m => ({ ...m, alvo: Number(m.alvo), guardado: Number(m.guardado) })),
    cartoes: cartoes.rows.map(c => ({ ...c, fatura: Number(c.fatura), limiteTotal: Number(c.limite_total) })),
    parcelas: parcelas.rows.map(p => ({ ...p, valor: Number(p.valor) })),
    recorrentes: recorrentes.rows.map(r => ({ ...r, valor: Number(r.valor) })),
    grupos: gruposComPessoas,
    reservas: reservas.rows.map(r => ({ id: r.id, valor: Number(r.valor), nota: r.nota, metaId: r.meta_id })),
    totalGuardado: reservas.rows.reduce((soma, r) => soma + Number(r.valor), 0),
  });
}));

// Atualiza nome e/ou foto do próprio usuário (diferente do nome/config do Cofre, que é compartilhado).
router.put('/perfil', asyncRoute(async (req, res) => {
  const { nome, foto } = req.body || {};
  if (!nome && foto === undefined) return res.status(400).json({ erro: 'Informe nome ou foto' });
  await pool.query(
    'UPDATE usuarios SET nome = COALESCE($1, nome), foto = COALESCE($2, foto) WHERE id = $3',
    [nome || null, foto === undefined ? null : foto, req.usuarioId]
  );
  res.json({ ok: true });
}));

function fmtDate(d) {
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

module.exports = router;
