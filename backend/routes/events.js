const express = require('express');
const router = express.Router();

const clients = new Set();

function broadcastUpdate() {
  const payload = `data: ${JSON.stringify({ type: 'update', ts: Date.now() })}\n\n`;
  clients.forEach(res => res.write(payload));
}

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  clients.add(res);
  req.on('close', () => clients.delete(res));

  const hb = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
  }, 30000);

  req.on('close', () => clearInterval(hb));
});

module.exports = { router, broadcastUpdate };
