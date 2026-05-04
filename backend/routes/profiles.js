const express = require('express');
const db = require('../db.js');

module.exports = function(broadcastUpdate) {
  const router = express.Router();

  router.put('/:user', (req, res) => {
    const { name, avatar, colorKey } = req.body;
    db.prepare('UPDATE profiles SET name = ?, avatar = ?, color_key = ? WHERE user = ?')
      .run(name, avatar, colorKey, req.params.user);
    broadcastUpdate();
    res.json({ ok: true });
  });

  return router;
};
