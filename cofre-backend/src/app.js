require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' })); // limite maior por causa da foto do recibo em base64

app.get('/', (req, res) => res.json({ ok: true, servico: 'Cofre API' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', require('./routes/auth'));
app.use('/me', require('./routes/me'));
app.use('/cofre', require('./routes/cofre'));
app.use('/categorias', require('./routes/categorias'));
app.use('/transacoes', require('./routes/transacoes'));
app.use('/orcamentos', require('./routes/orcamentos'));
app.use('/metas', require('./routes/metas'));
app.use('/reservas', require('./routes/reservas'));
app.use('/cartoes', require('./routes/cartoes'));
app.use('/parcelas', require('./routes/parcelas'));
app.use('/recorrentes', require('./routes/recorrentes'));
app.use('/grupos', require('./routes/grupos'));

app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;
