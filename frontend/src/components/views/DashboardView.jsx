import React, { useState } from 'react';
import { COLORS } from '../Atoms.jsx';
import { useLang } from '../../i18n.js';
import BetCard from '../BetCard.jsx';

function computeStreak(bets, user) {
  const days = new Set();
  for (const b of bets) {
    if (b.creator === user) days.add(new Date(b.createdAt).toDateString());
    if (b.status !== 'active' && b.resolvedAt && (b.creator === user || b.winnerId === user))
      days.add(new Date(b.resolvedAt).toDateString());
  }
  if (days.size === 0) return 0;
  const sorted = Array.from(days).map(d => new Date(d)).sort((a, b) => b - a);
  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (sorted[0].toDateString() !== today && sorted[0].toDateString() !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (Math.round((sorted[i-1] - sorted[i]) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}

export default function DashboardView({
  user, profiles, credits, bets, cats, feedEvents = [],
  onCreate,
  onResolve, onCounter, onAccept, onReject, onReveal, onEdit, onDelete,
  onFlame, reactions, onReaction, onReactionPhoto,
  onConfirmOutcome, onWithdrawResolve, onOvertime,
  can, isDesktop, pendingResolveIds, onNotifSeen,
  // kept for prop compat, unused in B3:
  groupMembers, notifSince, onGoToVault, onGoToBets,
  onEggUnlock, onOpenDie, onOpenIceEgg, onOpenPhoenixEgg,
}) {
  const { t } = useLang();
  const [tab, setTab] = useState('feed');

  const myProfile = profiles[user] ?? {};
  const myCredits = credits[user] ?? 0;
  const streak    = computeStreak(bets, user);
  const myColor   = COLORS[myProfile.colorKey] || '#5b8af0';

  const activeBets  = bets.filter(b => b.status === 'active' && !b.isSecret);
  const pendingBets = bets.filter(b =>
    b.status === 'pending' && (b.opponent === user || b.creator === user)
  );

  const totalInPlay    = activeBets.reduce((s, b) => s + b.stake, 0);
  const potentialTotal = activeBets.reduce((s, b) => s + b.potentialWin, 0);
  const sevenDaysAgo   = Date.now() - 7 * 86400000;

  const tabStyle = (id) => ({
    flex: 1, padding: '10px 4px',
    background: 'transparent', border: 'none',
    borderBottom: tab === id ? '2px solid var(--gold)' : '2px solid transparent',
    color: tab === id ? 'var(--gold)' : 'var(--dim)',
    fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: 700,
    letterSpacing: '.06em', textTransform: 'uppercase',
    cursor: 'pointer', position: 'relative',
    transition: 'color .15s, border-color .15s',
  });

  const countBadge = (n, color) => n > 0 ? (
    <span style={{
      marginLeft: 4, display: 'inline-block',
      background: color, color: '#fff', borderRadius: 999,
      fontSize: 8, fontWeight: 700, padding: '0 4px',
      minWidth: 14, height: 14, lineHeight: '14px', textAlign: 'center',
    }}>{n}</span>
  ) : null;

  const feedEventContent = (ev) => {
    const actorName = profiles[ev.feed_actor_id]?.name ?? '…';
    switch (ev.event_type) {
      case 'bet_won':            return { text: t('feed.bet_won',            { label: ev.feed_label ?? '' }), chip: `+₡ ${ev.feed_amount ?? ''}`, chipColor: 'var(--grn)' };
      case 'bet_lost':           return { text: t('feed.bet_lost',           { label: ev.feed_label ?? '' }), chip: `-₡ ${ev.feed_amount ?? ''}`, chipColor: 'var(--red)' };
      case 'bet_created':        return { text: t('feed.bet_created',        { actor: actorName, label: ev.feed_label ?? '' }), chip: ev.feed_category ?? '', chipColor: 'var(--pur)' };
      case 'bet_accepted':       return { text: t('feed.bet_accepted',       { actor: actorName }), chip: null, chipColor: null };
      case 'challenge_received': return { text: t('feed.challenge_received', { actor: actorName, label: ev.feed_label ?? '' }), chip: `₡ ${ev.feed_amount ?? ''}`, chipColor: 'var(--red)' };
      case 'trophy_unlocked':    return { text: t('feed.trophy_unlocked',    { label: ev.feed_label ?? '' }), chip: '🏆', chipColor: 'var(--gold)' };
      case 'bet_resolved_group': return { text: t('feed.bet_resolved_group', { actor: actorName, label: ev.feed_label ?? '' }), chip: ev.feed_category ?? '', chipColor: 'var(--dim)' };
      default:                   return { text: ev.event_type, chip: null, chipColor: null };
    }
  };

  const betCardProps = (b) => ({
    bet: b, user, profiles, cats,
    onResolve, onCounter, onFlame,
    reactions, onReaction, onReactionPhoto,
    onDelete, onEdit, onAccept, onReject,
    can, onReveal, onConfirmOutcome,
    onWithdrawResolve, onOvertime,
    pendingResolve: pendingResolveIds?.has(b.id),
  });

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ padding: '16px 0 0' }}>
        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `${myColor}22`, border: `2px solid ${myColor}4d`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, overflow: 'hidden',
          }}>
            {myProfile.avatarUrl
              ? <img src={myProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : myProfile.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', lineHeight: 1.2 }}>
              {myProfile.name}
            </div>
            {streak > 0 && (
              <div style={{ fontSize: 11, color: '#e8903f', fontWeight: 600, marginTop: 2 }}>
                🔥 {streak} {t('dashboard.streak')}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22, fontWeight: 700, color: 'var(--gold)', lineHeight: 1,
            }}>
              {myCredits} <span style={{ fontSize: 13, opacity: .7 }}>₡</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button onClick={onCreate} style={{
          width: '100%', padding: '12px 0',
          background: 'var(--pur)', color: '#fff',
          border: 'none', borderRadius: 9,
          fontFamily: "'Manrope', sans-serif",
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
          letterSpacing: '.02em',
        }}>
          {t('dashboard.cta')}
        </button>
      </div>

      {/* ── Tab strip ──────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--rule)', marginTop: 16 }}>
        <button style={tabStyle('feed')} onClick={() => setTab('feed')}>
          {t('dashboard.tab_feed')}
        </button>
        <button style={tabStyle('active')} onClick={() => setTab('active')}>
          {t('dashboard.tab_active')}
          {countBadge(activeBets.length, 'var(--pur)')}
        </button>
        <button style={tabStyle('pending')} onClick={() => setTab('pending')}>
          {t('dashboard.tab_pending')}
          {countBadge(pendingBets.length, 'var(--red)')}
        </button>
      </div>

      {/* ── Tab content ────────────────────────────────────── */}
      <div style={{ paddingTop: 14 }}>

        {/* Feed */}
        {tab === 'feed' && (
          <div>
            {feedEvents.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--dim)', fontSize: 13, padding: '32px 0' }}>
                {t('feed.empty')}
              </div>
            )}
            {feedEvents.map(ev => {
              const { text, chip, chipColor } = feedEventContent(ev);
              const actorP = profiles[ev.feed_actor_id];
              const actorColor = actorP ? (COLORS[actorP.colorKey] || '#5b8af0') : '#5b8af0';
              const isOld = ev.created_at < sevenDaysAgo;
              return (
                <div key={ev.id} style={{
                  display: 'flex', gap: 9, padding: '9px 0',
                  borderBottom: '1px solid var(--rule)',
                  opacity: isOld ? 0.4 : 1,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: `${actorColor}22`, border: `1px solid ${actorColor}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, overflow: 'hidden',
                  }}>
                    {actorP?.avatarUrl
                      ? <img src={actorP.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : actorP?.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--txt)', lineHeight: 1.4 }}>{text}</div>
                    {chip && (
                      <div style={{ marginTop: 3 }}>
                        <span style={{
                          display: 'inline-block', padding: '1px 6px', borderRadius: 4,
                          fontSize: 9, fontWeight: 600,
                          background: chipColor ? `${chipColor}1a` : 'var(--soft)',
                          color: chipColor ?? 'var(--dim)',
                        }}>{chip}</span>
                      </div>
                    )}
                    <div style={{ fontSize: 8, color: 'var(--dim)', marginTop: 2 }}>
                      {new Date(ev.created_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Attive */}
        {tab === 'active' && (
          <div>
            {activeBets.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--dim)', fontSize: 13, padding: '32px 0' }}>
                {t('dashboard.no_active')}
              </div>
            )}
            {activeBets.map(b => <BetCard key={b.id} {...betCardProps(b)} />)}
            {activeBets.length > 0 && (
              <div style={{ borderTop: '1px solid var(--rule)', marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--dim)' }}>Totale in gioco</span>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600 }}>₡ {totalInPlay}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--dim)' }}>Potenziale vincita</span>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, color: 'var(--grn)' }}>₡ {potentialTotal}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* In attesa */}
        {tab === 'pending' && (
          <div>
            {pendingBets.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--dim)', fontSize: 13, padding: '32px 0' }}>
                Nessuna bet in attesa
              </div>
            )}
            {pendingBets.map(b => <BetCard key={b.id} {...betCardProps(b)} />)}
          </div>
        )}

      </div>
    </div>
  );
}
