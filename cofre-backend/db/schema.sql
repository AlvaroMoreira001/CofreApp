-- Cofre — Controle de Gastos — esquema do banco (Postgres)
-- Executado automaticamente no boot do servidor (idempotente).

CREATE TABLE IF NOT EXISTS cofres (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT 'Minha carteira',
  renda NUMERIC NOT NULL DEFAULT 0,
  fechamento INTEGER NOT NULL DEFAULT 1,
  tema TEXT NOT NULL DEFAULT 'lilas',
  notificacoes BOOLEAN NOT NULL DEFAULT TRUE,
  convite_codigo TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE,
  UNIQUE(cofre_id, nome)
);

CREATE TABLE IF NOT EXISTS transacoes (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  cat TEXT NOT NULL,
  val NUMERIC NOT NULL,
  data DATE NOT NULL,
  origem TEXT,
  nota TEXT,
  foto TEXT,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transacoes_cofre ON transacoes(cofre_id);

CREATE TABLE IF NOT EXISTS orcamentos (
  id TEXT PRIMARY KEY,
  cat TEXT NOT NULL,
  limite NUMERIC NOT NULL,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE,
  UNIQUE(cofre_id, cat)
);

CREATE TABLE IF NOT EXISTS metas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  alvo NUMERIC NOT NULL,
  guardado NUMERIC NOT NULL DEFAULT 0,
  prazo TEXT,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cartoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  final TEXT,
  fatura NUMERIC NOT NULL DEFAULT 0,
  fecha TEXT,
  limite_total NUMERIC NOT NULL DEFAULT 0,
  tom TEXT,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parcelas (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  atual INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL DEFAULT 1,
  cartao TEXT,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recorrentes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  dia INTEGER NOT NULL DEFAULT 1,
  cat TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grupos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grupo_pessoas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  grupo_id TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grupo_despesas (
  id TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  pagador_id TEXT,
  pagador_nome TEXT,
  data DATE NOT NULL,
  grupo_id TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE
);

-- Dinheiro guardado (independente de meta, mas pode opcionalmente ser vinculado a uma).
CREATE TABLE IF NOT EXISTS reservas (
  id TEXT PRIMARY KEY,
  valor NUMERIC NOT NULL,
  nota TEXT,
  meta_id TEXT REFERENCES metas(id) ON DELETE SET NULL,
  cofre_id TEXT NOT NULL REFERENCES cofres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reservas_cofre ON reservas(cofre_id);

-- Colunas adicionadas depois da versão inicial do schema (ALTER idempotente, roda em todo boot).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto TEXT;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
