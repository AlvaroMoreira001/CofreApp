const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERRO: variável DATABASE_URL não definida. Veja .env.example.');
}

const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function migrar() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Banco migrado (tabelas garantidas).');
}

const CATEGORIAS_PADRAO = [
  ['Mercado', 'var(--color-accent-500)'],
  ['Transporte', 'var(--color-accent-2-500)'],
  ['Restaurante', 'var(--color-accent-400)'],
  ['Assinaturas', 'var(--color-accent-700)'],
  ['Casa', 'var(--color-neutral-500)'],
  ['Lazer', 'var(--color-accent-600)'],
  ['Saúde', 'var(--color-neutral-600)'],
  ['Outros', 'var(--color-neutral-700)'],
];

// Semeia um cofre novo só com as categorias padrão (sem transações, cartões,
// orçamentos, metas ou qualquer valor monetário de exemplo — a conta começa zerada).
async function semearCofre(client, cofreId) {
  const uid = () => require('crypto').randomUUID();
  for (const [nome, cor] of CATEGORIAS_PADRAO) {
    await client.query(
      'INSERT INTO categorias (id, nome, cor, cofre_id) VALUES ($1, $2, $3, $4)',
      [uid(), nome, cor, cofreId]
    );
  }
}

module.exports = { pool, migrar, semearCofre };
