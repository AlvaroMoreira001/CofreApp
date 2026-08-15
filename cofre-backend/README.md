# Cofre — API

Backend em Node + Express + PostgreSQL. Sem ORM pesado (SQL puro via `pg`),
sem passo de build — o Railway sobe isso direto.

## Rodar localmente (opcional, só se quiser testar antes de publicar)

Precisa de um Postgres local ou de uma DATABASE_URL de algum serviço (o
próprio Railway te dá uma gratuitamente, veja abaixo).

```bash
cp .env.example .env
# edite .env com sua DATABASE_URL e um JWT_SECRET
npm install
npm start
```

O servidor cria as tabelas sozinho no primeiro boot (não precisa rodar
migração manual).

## Publicar no Railway (passo a passo)

1. Crie uma conta em [railway.app](https://railway.app) (dá para entrar com GitHub).
2. **New Project → Deploy from GitHub repo.** Se ainda não subiu esta pasta
   pro GitHub: crie um repositório novo, coloque só o conteúdo de
   `cofre-backend/` nele (não precisa incluir o app Expo no mesmo repo) e
   suba com `git init && git add . && git commit -m "cofre api" && git push`.
3. No projeto que o Railway criar, clique em **+ New → Database → Add PostgreSQL**.
   Isso sobe um Postgres gerenciado dentro do mesmo projeto.
4. Volte no serviço do seu código (o que veio do GitHub) → aba **Variables**
   → clique em **New Variable → Add Reference** → escolha a variável
   `DATABASE_URL` do serviço Postgres. Isso conecta os dois automaticamente
   (sem copiar/colar senha).
5. Ainda em Variables, adicione manualmente:
   - `JWT_SECRET` → qualquer texto longo e aleatório (ex: gere um com
     `openssl rand -hex 32` no terminal)
6. O Railway detecta que é um projeto Node (por causa do `package.json`) e
   builda sozinho. Se quiser garantir, o `railway.json` já está configurado
   com `npm start`.
7. Espere o deploy terminar e abra a aba **Settings → Networking → Generate
   Domain**. Você recebe uma URL pública tipo
   `https://cofre-api-production.up.railway.app`.
8. Teste no navegador: abra `https://sua-url/health` — deve responder
   `{"status":"ok"}`. Esse é o endereço que você vai colocar no app Expo
   (veja o README da pasta `cofre-app`).

### Custos
O Railway tem um plano gratuito com limite de uso mensal (geralmente
suficiente para desenvolvimento e uso pessoal); passado o limite, cobra por
uso (é bem barato para uma API pequena como essa). Vale conferir os preços
atuais em [railway.app/pricing](https://railway.app/pricing).

## Rotas da API

| Rota | Método | Descrição |
|---|---|---|
| `/auth/registrar` | POST | Cria conta + Cofre novo (com dados de exemplo) |
| `/auth/entrar` | POST | Login (retorna token) |
| `/auth/convite` | POST | Entra em um Cofre existente via código de convite |
| `/me` | GET | Retorna todos os dados do usuário logado |
| `/cofre` | PUT | Atualiza nome, renda, tema, notificações |
| `/cofre/convite/gerar` | POST | Gera novo código de convite |
| `/categorias` | POST, DELETE /:id | Categorias |
| `/transacoes` | POST, PUT /:id, DELETE /:id | Lançamentos |
| `/orcamentos` | POST (upsert), DELETE /:id | Orçamentos por categoria |
| `/metas` | POST, PUT /:id, DELETE /:id | Metas |
| `/cartoes` | POST, PUT /:id, DELETE /:id | Cartões |
| `/parcelas` | POST, DELETE /:id | Parcelamentos |
| `/recorrentes` | POST, PUT /:id, DELETE /:id | Contas recorrentes |
| `/grupos` | POST, DELETE /:id | Grupos de divisão de despesas |
| `/grupos/:id/pessoas` | POST, DELETE /:pessoaId | Pessoas do grupo |
| `/grupos/:id/despesas` | POST, DELETE /:despesaId | Despesas do grupo |

Todas as rotas (exceto `/auth/*`, `/` e `/health`) exigem o header
`Authorization: Bearer <token>`.
