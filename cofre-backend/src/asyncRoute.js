// Envolve um handler async para encaminhar erros ao Express automaticamente.
module.exports = function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
