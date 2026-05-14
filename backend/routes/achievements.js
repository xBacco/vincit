'use strict';
const express = require('express');
const db = require('../db.js');
const router = express.Router();
const { CATALOG, listForUser, computeProgressFor, unlockSecret, refreshFinalTrophy } = require('../achievements.js');

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
    // Optional `level` in body — defaults to 1 for backward-compat with
    // single-level secrets. egg_dice uses level=2 when the user has
    // rolled all 6 distinct faces.
    const level = Number.isFinite(req.body?.level) ? Math.floor(req.body.level) : 1;
    const result = await unlockSecret(req.userId, req.params.id, level);
    res.json(result);
  } catch (e) {
    if (e.message === 'unknown_secret') return res.status(400).json({ error: 'unknown_secret' });
    if (e.message === 'invalid_level') return res.status(400).json({ error: 'invalid_level' });
    console.error('[secret-unlock]', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// POST /api/achievements/mine/dev-set — dev/admin tool: force all trophies to a
// specific level (0 = wipe, 1–5 = set every catalog entry to min(targetLevel, max)).
// Secrets and egg_master are included. gran_finale is re-evaluated automatically.
router.post('/mine/dev-set', async (req, res) => {
  try {
    const targetLevel = Math.round(Number(req.body?.targetLevel ?? 0));
    if (!Number.isFinite(targetLevel) || targetLevel < 0 || targetLevel > 5) {
      return res.status(400).json({ error: 'targetLevel must be 0–5' });
    }

    // Always wipe first so we start from a clean slate.
    await db.query('DELETE FROM achievements WHERE user_id=$1', [req.userId]);

    if (targetLevel === 0) {
      return res.json({ ok: true, inserted: 0 });
    }

    let inserted = 0;
    const now = Date.now();
    for (const entry of CATALOG) {
      if (entry.final) continue; // gran_finale is awarded by refreshFinalTrophy
      const upTo = Math.min(targetLevel, entry.levels.length);
      for (let lvl = 1; lvl <= upTo; lvl++) {
        await db.query(
          `INSERT INTO achievements(user_id, achievement_id, level, unlocked_at)
           VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [req.userId, entry.id, lvl, now]
        );
        inserted++;
      }
    }

    // Check if gran_finale now qualifies (will insert its rows automatically).
    await refreshFinalTrophy(req.userId);

    res.json({ ok: true, inserted });
  } catch (e) {
    console.error('[dev-set-trophies]', e);
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
