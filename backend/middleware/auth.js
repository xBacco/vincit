'use strict';
const jwt    = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function verify(token) {
  const p = jwt.verify(token, SECRET);
  return { userId: p.userId, roomId: p.roomId ?? null, userName: p.name };
}

function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.slice(7);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    Object.assign(req, verify(token));
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}

// SSE variant: EventSource cannot send custom headers — reads token from ?token= query param
function authMiddlewareSSE(req, res, next) {
  try {
    const token = req.headers.authorization?.slice(7) || req.query.token;
    if (!token) return res.status(401).end();
    Object.assign(req, verify(token));
    next();
  } catch { res.status(401).end(); }
}

module.exports = { authMiddleware, authMiddlewareSSE };
