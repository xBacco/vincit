const express = require('express');
const db = require('../db.js');

module.exports = function(broadcastUpdate) {
  const router = express.Router();

  router.post('/', (req, res) => {
    const { id, emoji, label, color } = req.body;
    db.prepare('INSERT INTO categories (id, emoji, label, color) VALUES (?, ?, ?, ?)')
      .run(id, emoji, label, color);
    broadcastUpdate();
    res.status(201).json({ id });
  });

  router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    broadcastUpdate();
    res.json({ ok: true });
  });

  return router;
};
