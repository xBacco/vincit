'use strict';
const express = require('express');
const router = express.Router();
const { CATALOG, listForUser, computeProgressFor } = require('../achievements.js');

// GET /api/achievements — list catalog + this user's unlocked + per-id progress
router.get('/', async (req, res) => {
  try {
    const [unlocked, progress] = await Promise.all([
      listForUser(req.userId),
      computeProgressFor(req.userId),
    ]);
    res.json({ catalog: CATALOG, unlocked, progress });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
