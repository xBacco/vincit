const express = require('express');
const db = require('../db.js');

module.exports = function(broadcastUpdate) {
  const router = express.Router();

  router.put('/', (req, res) => {
    const { tomas, giulia } = req.body;
    db.transaction(() => {
      db.prepare('UPDATE credits SET amount = ? WHERE user = ?').run(tomas, 'tomas');
      db.prepare('UPDATE credits SET amount = ? WHERE user = ?').run(giulia, 'giulia');
    })();
    broadcastUpdate();
    res.json({ ok: true });
  });

  return router;
};
