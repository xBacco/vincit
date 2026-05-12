'use strict';
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const db      = require('../db.js');

const VALID_BET_TYPES = new Set(['vault', 'open', 'targeted', 'surprise']);

function sanitize(body) {
  const name = (body.name ?? '').trim().slice(0, 60);
  const title = (body.title ?? '').trim().slice(0, 200);
  const quota = parseFloat(body.quota);
  const stake = parseInt(body.stake, 10);
  const category = (body.category ?? null);
  const betType = VALID_BET_TYPES.has(body.bet_type) ? body.bet_type : 'open';
  const pegno = (body.pegno ?? '').trim().slice(0, 200) || null;

  if (!name)                       return { error: 'name_required' };
  if (!title)                      return { error: 'title_required' };
  if (!Number.isFinite(quota) || quota < 1.01 || quota > 100)
                                   return { error: 'invalid_quota' };
  if (!Number.isInteger(stake) || stake < 1)
                                   return { error: 'invalid_stake' };

  return { ok: { name, title, quota, stake, category, betType, pegno } };
}

// GET /api/templates — list this user's templates
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, title, quota, stake, category, bet_type, pegno, created_at
       FROM bet_templates WHERE user_id=$1 ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/templates — create
router.post('/', async (req, res) => {
  try {
    const v = sanitize(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const { name, title, quota, stake, category, betType, pegno } = v.ok;
    const id = `tpl_${crypto.randomUUID()}`;
    await db.query(
      `INSERT INTO bet_templates
         (id, user_id, name, title, quota, stake, category, bet_type, pegno, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, req.userId, name, title, quota, stake, category, betType, pegno, Date.now()]
    );
    res.status(201).json({ id, name, title, quota, stake, category, bet_type: betType, pegno });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// PATCH /api/templates/:id — update (only owner)
router.patch('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id FROM bet_templates WHERE id=$1', [req.params.id]);
    if (!rows.length)                       return res.status(404).json({ error: 'Not found' });
    if (rows[0].user_id !== req.userId)     return res.status(403).json({ error: 'Forbidden' });
    const v = sanitize(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const { name, title, quota, stake, category, betType, pegno } = v.ok;
    await db.query(
      `UPDATE bet_templates
         SET name=$1, title=$2, quota=$3, stake=$4, category=$5, bet_type=$6, pegno=$7
       WHERE id=$8`,
      [name, title, quota, stake, category, betType, pegno, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/templates/:id — owner only
router.delete('/:id', async (req, res) => {
  try {
    const r = await db.query('DELETE FROM bet_templates WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
