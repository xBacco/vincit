'use strict';
const express = require('express');
const db = require('../db.js');
const router = express.Router();
const { CATALOG, listForUser, computeProgressFor, unlockSecret } = require('../achievements.js');

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

// POST /api/achievements/secret/:id/unlock — easter egg endpoint. The
// client triggers this when one of the hidden interactions completes
// (rolling all 6 dice faces, first coin flip, JACKPOT bet title). No
// game-state validation here — the action is purely cosmetic and the
// achievement is the reward; cheating costs nothing.
router.post('/secret/:id/unlock', async (req, res) => {
  try {
    const result = await unlockSecret(req.userId, req.params.id);
    res.json(result);
  } catch (e) {
    if (e.message === 'unknown_secret') return res.status(400).json({ error: 'unknown_secret' });
    console.error('[secret-unlock]', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// DELETE /api/achievements/mine — wipe ALL trophy rows for the calling user.
// Used by the admin "Reset trofei" button so the dev can re-trigger every
// unlock animation and easter-egg notification from scratch. Server-side
// is just a row delete; client clears its own LS flags + reloads.
router.delete('/mine', async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM achievements WHERE user_id=$1',
      [req.userId]
    );
    res.json({ ok: true, deleted: rowCount });
  } catch (e) {
    console.error('[achievements-reset]', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
