'use strict';
const express = require('express');
const db = require('../db.js');

const VALID_EMOJIS = ['🔥', '😂', '👀', '💀', '⚡'];

module.exports = function(broadcastUpdate) {
  const router = express.Router();

  router.post('/:id/reaction', async (req, res) => {
    try {
      const bettor = req.userId;
      const { emoji } = req.body;
      if (!VALID_EMOJIS.includes(emoji)) {
        return res.status(400).json({ error: 'Emoji non valida' });
      }
      const { rows } = await db.query('SELECT room_id FROM bets WHERE id=$1', [req.params.id]);
      if (!rows[0] || rows[0].room_id !== req.roomId) return res.status(403).json({ error: 'Forbidden' });
      await db.query(
        `INSERT INTO reactions (bet_id, bettor, emoji)
         VALUES ($1, $2, $3)
         ON CONFLICT (bet_id, bettor) DO UPDATE SET emoji = $3`,
        [req.params.id, bettor, emoji]
      );
      broadcastUpdate(req.roomId);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/:id/reaction/:bettor', async (req, res) => {
    try {
      const { rows } = await db.query('SELECT room_id FROM bets WHERE id=$1', [req.params.id]);
      if (!rows[0] || rows[0].room_id !== req.roomId) return res.status(403).json({ error: 'Forbidden' });
      await db.query(
        'DELETE FROM reactions WHERE bet_id = $1 AND bettor = $2',
        [req.params.id, req.userId]
      );
      broadcastUpdate(req.roomId);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
