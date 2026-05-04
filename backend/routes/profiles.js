'use strict';
const express = require('express');
const db = require('../db.js');

module.exports = function(broadcastUpdate) {
  const router = express.Router();

  router.put('/:user', async (req, res) => {
    try {
      const { name, avatar, colorKey } = req.body;
      await db.query(
        'UPDATE profiles SET name = $1, avatar = $2, color_key = $3 WHERE "user" = $4',
        [name, avatar, colorKey, req.params.user]
      );
      broadcastUpdate();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
