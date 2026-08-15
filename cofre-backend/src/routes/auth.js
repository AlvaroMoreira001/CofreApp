const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool, semearCofre } = require('../db');
const { assinarToken } = require('../auth');
const asyncRoute = require('../asyncRoute');

const router = express.Router();

function gerarCodigoConvite() {
  return 'COFRE-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function usuarioPublico(u) {
  return { id: u.id, email: u.email, nome: u.nome, cofreId: u.cofre_id };
}

// Cria uma conta nova + um Cofre novo, zerado (só com as categorias padrão).
router.post('/registrar', asyncRoute(async (req, res) => {
  const { email, senha, nome, renda } = req.body || {};
  if (!email || !senha || !nome) return res.status(400).json({ erro: 'Informe nome, email e senha' });
  if (String(senha).length < 6) return res.status(400).json({ erro: 'A senha precisa ter ao menos 6 caracteres' });

  const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [String(email).toLowerCase()]);
  if (existente.rows.length) return res.status(409).json({ erro: 'Já existe uma conta com esse email' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cofreId = crypto.randomUUID();
    await client.query(
      'INSERT INTO cofres (id, nome, renda, convite_codigo) VALUES ($1, $2, $3, $4)',
      [cofreId, nome + ' — carteira', renda || 0, gerarCodigoConvite()]
    );
    await semearCofre(client, cofreId);

    const usuarioId = crypto.randomUUID();
    const senhaHash = await bcrypt.hash(senha, 10);
    await client.query(
      'INSERT INTO usuarios (id, email, senha_hash, nome, cofre_id) VALUES ($1,$2,$3,$4,$5)',
      [usuarioId, String(email).toLowerCase(), senhaHash, nome, cofreId]
    );

    await client.query('COMMIT');
    const usuario = { id: usuarioId, email: email.toLowerCase(), nome, cofre_id: cofreId };
    res.status(201).json({ token: assinarToken(usuario), usuario: usuarioPublico(usuario) });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

router.post('/entrar', asyncRoute(async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ erro: 'Informe email e senha' });
  const r = await pool.query('SELECT * FROM usuarios WHERE email = $1', [String(email).toLowerCase()]);
  const usuario = r.rows[0];
  if (!usuario) return res.status(401).json({ erro: 'Email ou senha incorretos' });
  const ok = await bcrypt.compare(senha, usuario.senha_hash);
  if (!ok) return res.status(401).json({ erro: 'Email ou senha incorretos' });
  res.json({ token: assinarToken(usuario), usuario: usuarioPublico(usuario) });
}));

// Entra em um Cofre já existente usando o código de convite (perfil compartilhado real).
router.post('/convite', asyncRoute(async (req, res) => {
  const { codigo, email, senha, nome } = req.body || {};
  if (!codigo || !email || !senha || !nome) return res.status(400).json({ erro: 'Preencha todos os campos' });
  const cofreR = await pool.query('SELECT * FROM cofres WHERE convite_codigo = $1', [String(codigo).toUpperCase().trim()]);
  const cofre = cofreR.rows[0];
  if (!cofre) return res.status(404).json({ erro: 'Código de convite inválido' });

  const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [String(email).toLowerCase()]);
  if (existente.rows.length) return res.status(409).json({ erro: 'Já existe uma conta com esse email' });

  const usuarioId = crypto.randomUUID();
  const senhaHash = await bcrypt.hash(senha, 10);
  await pool.query('INSERT INTO usuarios (id, email, senha_hash, nome, cofre_id) VALUES ($1,$2,$3,$4,$5)', [usuarioId, email.toLowerCase(), senhaHash, nome, cofre.id]);

  // adiciona essa pessoa em todos os grupos existentes do cofre, se ainda não estiver
  const grupos = await pool.query('SELECT id FROM grupos WHERE cofre_id = $1', [cofre.id]);
  for (const g of grupos.rows) {
    await pool.query('INSERT INTO grupo_pessoas (id, nome, usuario_id, grupo_id) VALUES ($1,$2,$3,$4)', [crypto.randomUUID(), nome, usuarioId, g.id]);
  }

  const usuario = { id: usuarioId, email: email.toLowerCase(), nome, cofre_id: cofre.id };
  res.status(201).json({ token: assinarToken(usuario), usuario: usuarioPublico(usuario) });
}));

module.exports = router;
