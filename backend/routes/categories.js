'use strict';
const express = require('express');
const db = require('../db.js');

module.exports = function(broadcastUpdate) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const { id, emoji, label, color } = req.body;
      await db.query(
        'INSERT INTO categories (id, emoji, label, color) VALUES ($1,$2,$3,$4)',
        [id, emoji, label, color]
      );
      broadcastUpdate();
      res.status(201).json({ id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
      broadcastUpdate();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
