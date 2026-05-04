'use strict';
const express = require('express');
const db = require('../db.js');

module.exports = function(broadcastUpdate) {
  const router = express.Router();

  router.put('/', async (req, res) => {
    try {
      const { tomas, giulia } = req.body;
      await db.transaction(async (client) => {
        await client.query('UPDATE credits SET amount = $1 WHERE "user" = $2', [tomas, 'tomas']);
        await client.query('UPDATE credits SET amount = $1 WHERE "user" = $2', [giulia, 'giulia']);
      });
      broadcastUpdate();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
