'use strict';
const db = require('./db.js');
const { sendPushToUser, isPrefEnabled } = require('./routes/push.js');

// Static catalog. UI uses these ids and renders title/desc from i18n.
// "category": positive | challenge | shadow (loss-themed) | mission (special)
const CATALOG = [
  // Wins ladder
  { id: 'first_win',    icon: '🎯', tier: 'bronze', category: 'positive' },
  { id: 'wins_5',       icon: '🥉', tier: 'bronze', category: 'positive' },
  { id: 'wins_25',      icon: '🥈', tier: 'silver', category: 'positive' },
  { id: 'wins_100',     icon: '🥇', tier: 'gold',   category: 'positive' },
  // Streaks (positive)
  { id: 'streak_3',     icon: '🔥', tier: 'bronze', category: 'positive' },
  { id: 'streak_5',     icon: '🔥', tier: 'silver', category: 'positive' },
  { id: 'streak_10',    icon: '🔥', tier: 'gold',   category: 'positive' },
  // High-odds challenges
  { id: 'bluff',        icon: '🃏', tier: 'silver', category: 'challenge' },
  { id: 'outsider',     icon: '🌙', tier: 'silver', category: 'challenge' },
  { id: 'miracle',      icon: '💫', tier: 'gold',   category: 'challenge' },
  // Volume
  { id: 'total_10',     icon: '🎲', tier: 'bronze', category: 'positive' },
  { id: 'total_50',     icon: '🎲', tier: 'silver', category: 'positive' },
  // Special wins
  { id: 'surprise_won', icon: '🤫', tier: 'silver', category: 'mission' },
  { id: 'target_won',   icon: '🛡', tier: 'silver', category: 'mission' },
  { id: 'epic_pegno',   icon: '🎁', tier: 'silver', category: 'mission' },
  // Shadow (loss-themed) — visible but hopefully unlocked rarely
  { id: 'first_loss',     icon: '🥲', tier: 'bronze', category: 'shadow' },
  { id: 'loss_streak_3',  icon: '🧊', tier: 'bronze', category: 'shadow' },
  { id: 'loss_streak_5',  icon: '❄️', tier: 'silver', category: 'shadow' },
  { id: 'loss_streak_10', icon: '💀', tier: 'gold',   category: 'shadow' },
  { id: 'total_losses_25', icon: '📉', tier: 'silver', category: 'shadow' },
  // Recovery + earnings
  { id: 'comeback',      icon: '⚖',  tier: 'silver', category: 'mission' },
  { id: 'comeback_5',    icon: '🔥', tier: 'gold',   category: 'mission' },
  { id: 'equilibrium',   icon: '⚖',  tier: 'silver', category: 'mission' },
  { id: 'earnings_500',  icon: '💎', tier: 'gold',   category: 'positive' },
  { id: 'earnings_1000', icon: '👑', tier: 'gold',   category: 'positive' },
];

// Returns map { id → { current, target } } so the UI can show progress bars.
// `unlocked` is derived from current >= target.
async function computeProgressFor(userId) {
  const { rows: bets } = await db.query(
    `SELECT id, creator, status, quota, stake, potential_win,
            is_surprise, target_user, opponent, pegno,
            COALESCE(created_at, 0) AS created_at
     FROM bets
     WHERE creator=$1 AND status IN ('won','lost')
     ORDER BY created_at ASC`,
    [userId]
  );

  const wins   = bets.filter(b => b.status === 'won');
  const losses = bets.filter(b => b.status === 'lost');

  // Compute streaks
  let bestWinStreak = 0, curWin = 0;
  let bestLossStreak = 0, curLoss = 0;
  for (const b of bets) {
    if (b.status === 'won')  { curWin++;  curLoss = 0; if (curWin > bestWinStreak)  bestWinStreak  = curWin;  }
    else                     { curLoss++; curWin  = 0; if (curLoss > bestLossStreak) bestLossStreak = curLoss; }
  }

  // High-odds wins
  const winMaxQuota = wins.reduce((mx, b) => Math.max(mx, parseFloat(b.quota || 0)), 0);

  // Surprise/target/pegno wins
  const wonSurprise = wins.some(b => b.is_surprise === 1) ? 1 : 0;
  const wonPegno    = wins.some(b => (b.pegno || '').trim().length > 0) ? 1 : 0;

  // Target reveal (this user was the target of any resolved bet)
  const { rows: targetRows } = await db.query(
    `SELECT 1 FROM bets WHERE target_user=$1 AND status IN ('won','lost') LIMIT 1`,
    [userId]
  );
  const wasTargeted = targetRows.length ? 1 : 0;

  // Comeback / comeback_5: win after N losses in a row
  let lossesBeforeWin = 0;
  let comeback3 = 0, comeback5 = 0;
  for (const b of bets) {
    if (b.status === 'lost') lossesBeforeWin++;
    else {
      if (lossesBeforeWin >= 3) comeback3 = 1;
      if (lossesBeforeWin >= 5) comeback5 = 1;
      lossesBeforeWin = 0;
    }
  }

  // Cumulative net winnings from all won bets (delta = potential_win - stake)
  const totalEarnings = wins.reduce(
    (s, b) => s + (Number(b.potential_win) - Number(b.stake)),
    0
  );

  return {
    first_win:       { current: wins.length,   target: 1 },
    wins_5:          { current: wins.length,   target: 5 },
    wins_25:         { current: wins.length,   target: 25 },
    wins_100:        { current: wins.length,   target: 100 },

    streak_3:        { current: bestWinStreak, target: 3 },
    streak_5:        { current: bestWinStreak, target: 5 },
    streak_10:       { current: bestWinStreak, target: 10 },

    bluff:           { current: winMaxQuota >= 3  ? 3  : winMaxQuota, target: 3 },
    outsider:        { current: winMaxQuota >= 5  ? 5  : winMaxQuota, target: 5 },
    miracle:         { current: winMaxQuota >= 10 ? 10 : winMaxQuota, target: 10 },

    total_10:        { current: bets.length,   target: 10 },
    total_50:        { current: bets.length,   target: 50 },

    surprise_won:    { current: wonSurprise,   target: 1 },
    target_won:      { current: wasTargeted,   target: 1 },
    epic_pegno:      { current: wonPegno,      target: 1 },

    first_loss:       { current: losses.length,   target: 1 },
    loss_streak_3:    { current: bestLossStreak,  target: 3 },
    loss_streak_5:    { current: bestLossStreak,  target: 5 },
    loss_streak_10:   { current: bestLossStreak,  target: 10 },
    total_losses_25:  { current: losses.length,   target: 25 },

    comeback:        { current: comeback3,     target: 1 },
    comeback_5:      { current: comeback5,     target: 1 },
    equilibrium:     { current: Math.min(wins.length, losses.length), target: 10 },
    earnings_500:    { current: totalEarnings,  target: 500 },
    earnings_1000:   { current: totalEarnings,  target: 1000 },
  };
}

function unlockedIdsFromProgress(progress) {
  const out = [];
  for (const [id, p] of Object.entries(progress)) {
    if (p.current >= p.target) out.push(id);
  }
  return out;
}

// Check what's new and insert + notify.
async function refreshAchievements(userId) {
  try {
    const progress = await computeProgressFor(userId);
    const qualified = unlockedIdsFromProgress(progress);
    if (!qualified.length) return [];
    const { rows: already } = await db.query(
      'SELECT achievement_id FROM achievements WHERE user_id=$1', [userId]
    );
    const had = new Set(already.map(r => r.achievement_id));
    const newOnes = qualified.filter(id => !had.has(id));
    if (!newOnes.length) return [];

    const now = Date.now();
    for (const a of newOnes) {
      await db.query(
        `INSERT INTO achievements(user_id, achievement_id, unlocked_at)
         VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
        [userId, a, now]
      );
    }

    if (await isPrefEnabled(userId, 'on_resolved')) {
      sendPushToUser(userId, {
        title: newOnes.length === 1 ? '🏆 Trofeo sbloccato!' : `🏆 ${newOnes.length} trofei sbloccati!`,
        body:  newOnes.length === 1
          ? `Hai sbloccato un nuovo trofeo`
          : `Hai sbloccato ${newOnes.length} trofei nuovi`,
        url:   '/',
      });
    }
    return newOnes;
  } catch (e) {
    console.error('[achievements] refresh failed', e);
    return [];
  }
}

async function listForUser(userId) {
  const { rows } = await db.query(
    'SELECT achievement_id, unlocked_at FROM achievements WHERE user_id=$1',
    [userId]
  );
  return rows;
}

module.exports = {
  CATALOG, refreshAchievements, listForUser,
  computeProgressFor, unlockedIdsFromProgress,
};
