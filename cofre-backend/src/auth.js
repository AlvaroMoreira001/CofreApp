const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'troque-isto-por-um-texto-aleatorio-longo';
if (SECRET === 'troque-isto-por-um-texto-aleatorio-longo') {
  console.warn('AVISO: JWT_SECRET não definido — usando valor padrão inseguro. Defina JWT_SECRET no .env / no Railway.');
}

function assinarToken(usuario) {
  return jwt.sign({ uid: usuario.id, cofreId: usuario.cofre_id }, SECRET, { expiresIn: '180d' });
}

function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Não autenticado' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.usuarioId = payload.uid;
    req.cofreId = payload.cofreId;
    next();
  } catch (e) {
    return res.status(401).json({ erro: 'Sessão expirada, faça login novamente' });
  }
}

module.exports = { assinarToken, autenticar, SECRET };
