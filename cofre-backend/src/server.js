require('dotenv').config();
const app = require('./app');
const { migrar } = require('./db');

const PORT = process.env.PORT || 3000;

migrar()
  .then(() => {
    app.listen(PORT, () => console.log(`Cofre API rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('Falha ao migrar o banco de dados:', err);
    process.exit(1);
  });
