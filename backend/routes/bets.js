const express = require('express');
const db = require('../db.js');

module.exports = function(broadcastUpdate) {
  const router = express.Router();

  router.post('/', (req, res) => {
    const { id, creator, title, quota, stake, potentialWin,
            category, isSecret, isCounterable, pegno, expiresAt, createdAt } = req.body;

    const insertBet = db.prepare(`
      INSERT INTO bets (id, creator, title, quota, stake, potential_win,
        category, is_secret, is_counterable, pegno, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const deductCredits = db.prepare(
      'UPDATE credits SET amount = amount - ? WHERE user = ?'
    );

    db.transaction(() => {
      insertBet.run(id, creator, title, quota, stake, potentialWin,
        category, isSecret ? 1 : 0, isCounterable ? 1 : 0,
        pegno || null, expiresAt || null, createdAt);
      deductCredits.run(stake, creator);
    })();

    broadcastUpdate();
    res.status(201).json({ id });
  });

  router.patch('/:id/resolve', (req, res) => {
    const { outcome } = req.body;
    const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(req.params.id);
    if (!bet) return res.status(404).json({ error: 'Bet not found' });

    const counters = db.prepare('SELECT * FROM counter_bets WHERE bet_id = ?').all(bet.id);

    db.transaction(() => {
      db.prepare('UPDATE bets SET status = ? WHERE id = ?').run(outcome, bet.id);

      if (outcome === 'won') {
        db.prepare('UPDATE credits SET amount = amount + ? WHERE user = ?')
          .run(bet.potential_win, bet.creator);
      }

      counters.forEach(cb => {
        const cbWon = (outcome === 'won' && cb.side === 'yes') ||
                      (outcome === 'lost' && cb.side === 'no');
        db.prepare('UPDATE counter_bets SET status = ? WHERE id = ?')
          .run(cbWon ? 'won' : 'lost', cb.id);
        if (cbWon) {
          db.prepare('UPDATE credits SET amount = amount + ? WHERE user = ?')
            .run(cb.potential_win, cb.bettor);
        }
      });
    })();

    broadcastUpdate();
    res.json({ ok: true });
  });

  router.post('/:id/counter', (req, res) => {
    const { id, bettor, side, quotaUsed, stake, potentialWin } = req.body;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO counter_bets (id, bet_id, bettor, side, quota_used, stake, potential_win)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.params.id, bettor, side, quotaUsed, stake, potentialWin);
      db.prepare('UPDATE credits SET amount = amount - ? WHERE user = ?').run(stake, bettor);
    })();

    broadcastUpdate();
    res.status(201).json({ id });
  });

  router.patch('/:id/flame', (req, res) => {
    db.prepare('UPDATE bets SET flamed = ((flamed | 1) - (flamed & 1)) WHERE id = ?')
      .run(req.params.id);
    broadcastUpdate();
    res.json({ ok: true });
  });

  return router;
};
