const express = require('express');
const router = express.Router();
const db = require('../db.js');

function buildState() {
  const profiles = {};
  db.prepare('SELECT * FROM profiles').all().forEach(r => {
    profiles[r.user] = { name: r.name, avatar: r.avatar, colorKey: r.color_key };
  });

  const credits = {};
  db.prepare('SELECT * FROM credits').all().forEach(r => {
    credits[r.user] = r.amount;
  });

  const allCounters = db.prepare('SELECT * FROM counter_bets').all();
  const countersByBetId = {};
  allCounters.forEach(r => {
    if (!countersByBetId[r.bet_id]) countersByBetId[r.bet_id] = [];
    countersByBetId[r.bet_id].push({
      id:           r.id,
      betId:        r.bet_id,
      bettor:       r.bettor,
      side:         r.side,
      quotaUsed:    r.quota_used,
      stake:        r.stake,
      potentialWin: r.potential_win,
      status:       r.status,
    });
  });

  const bets = db.prepare('SELECT * FROM bets ORDER BY created_at DESC').all().map(r => ({
    id:            r.id,
    creator:       r.creator,
    title:         r.title,
    quota:         r.quota,
    stake:         r.stake,
    potentialWin:  r.potential_win,
    category:      r.category,
    isSecret:      r.is_secret === 1,
    isCounterable: r.is_counterable === 1,
    pegno:         r.pegno,
    expiresAt:     r.expires_at,
    createdAt:     r.created_at,
    status:        r.status,
    flamed:        r.flamed === 1,
    counterBets:   countersByBetId[r.id] || [],
  }));

  const categories = db.prepare('SELECT * FROM categories').all().map(r => ({
    id:    r.id,
    e:     r.emoji,
    label: r.label,
    color: r.color,
  }));

  return { profiles, credits, bets, categories };
}

router.get('/', (req, res) => {
  res.json(buildState());
});

module.exports = router;
