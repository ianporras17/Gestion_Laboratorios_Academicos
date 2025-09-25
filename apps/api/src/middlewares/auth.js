const { verifyJwt } = require('../utils/jwt');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const decoded = verifyJwt(token);
    req.user = decoded; // { id, role }
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authRequired };
