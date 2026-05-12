import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as api from '../../api.js';
import { useLang } from '../../i18n.js';
import { useToast } from '../../Toast.jsx';
import { COLORS } from '../Atoms.jsx';

function timeAgo(ts, t) {
  if (!ts || Number(ts) === 0) return null;
  const diff = Date.now() - Number(ts);
  if (diff < 0) return null;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return t('picker.now');
  if (m < 60) return t('picker.ago_min', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('picker.ago_h',   { n: h });
  const d = Math.floor(h / 24);
  if (d < 30) return t('picker.ago_d',   { n: d });
  return t('picker.ago_mo', { n: Math.floor(d / 30) });
}

function Avatar({ p, size = 44 }) {
  const color = COLORS[p?.color_key] || '#5b8af0';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}33`, border: `2px solid ${color}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.5), overflow: 'hidden', flexShrink: 0,
      color: '#fff',
    }}>
      {p?.avatar_url
        ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        : (p?.avatar || '?')}
    </div>
  );
}

function InviteToGroupModal({ friend, groups, onInvite, onClose }) {
  const { t } = useLang();
  const sharedIds = useMemo(() => new Set((friend.shared_groups || []).map(g => g.id)), [friend.shared_groups]);
  // Only groups where I have manage_members capability (owner OR co-admin)
  // AND the friend is not already a member.
  const eligible = useMemo(() => groups.filter(g => {
    if (sharedIds.has(g.id)) return false;
    const isOwner   = g.role === 'owner';
    const canManage = isOwner || (g.role === 'co-admin' && g.permissions?.manage_members === true);
    return canManage;
  }), [groups, sharedIds]);

  const [busy, setBusy] = useState(null);

  const invite = async g => {
    setBusy(g.id);
    try {
      await onInvite(g.id);
    } finally { setBusy(null); }
  };

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9100, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} className="bIn" style={{
        background: 'var(--surf)', border: '1px solid var(--brd)',
        borderRadius: 18, width: '100%', maxWidth: 440,
        maxHeight: 'calc(100dvh - 32px)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,.6)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderBottom: '1px solid var(--brd)',
        }}>
          <Avatar p={friend} size={42}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {t('friends.invite_title')}
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {friend.name}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--brd)', borderRadius: 10,
            color: 'var(--dim)', padding: '5px 11px', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
          }}>✕</button>
        </div>

        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {eligible.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 12px',
              color: 'var(--dim)', fontSize: 13, lineHeight: 1.5,
            }}>
              {t('friends.no_eligible')}
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 11, color: 'var(--dim)', letterSpacing: 1.5,
                textTransform: 'uppercase', fontWeight: 700, marginBottom: 10,
              }}>{t('friends.pick_group')}</div>
              {eligible.map(g => (
                <button key={g.id}
                  onClick={() => invite(g)}
                  disabled={busy !== null}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', marginBottom: 8,
                    background: 'var(--card)', border: '1px solid var(--brd)',
                    borderRadius: 12, cursor: busy ? 'wait' : 'pointer',
                    color: 'var(--txt)', textAlign: 'left',
                    transition: 'all .18s',
                    opacity: busy && busy !== g.id ? .4 : 1,
                  }}
                  onMouseEnter={e => { if (!busy) { e.currentTarget.style.borderColor = 'var(--gold)55'; e.currentTarget.style.background = 'var(--gold)08'; } }}
                  onMouseLeave={e => { if (!busy) { e.currentTarget.style.borderColor = 'var(--brd)'; e.currentTarget.style.background = 'var(--card)'; } }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 11,
                    background: 'var(--gold)15', border: '1px solid var(--gold)44',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>{g.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
                      👥 {g.member_count} · {g.role === 'owner' ? '★ owner' : '☆ co-admin'}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--gold)' }}>
                    {busy === g.id ? '…' : '➤'}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function FriendsView({ groups, user, onSwitchToGroup, isDesktop }) {
  const { t }   = useLang();
  const toast   = useToast();
  const [friends,    setFriends]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [query,      setQuery]      = useState('');
  const [inviting,   setInviting]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setFriends(await api.getFriends()); }
    catch (e) { setError(e?.error || 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(f => f.name.toLowerCase().includes(q));
  }, [friends, query]);

  const handleInvite = async groupId => {
    try {
      await api.inviteFriend(groupId, inviting.id);
      toast.success(t('friends.invited_ok', { name: inviting.name }));
      setInviting(null);
      load();  // refresh — shared_groups will include the new one
    } catch (e) {
      const msg = e?.error === 'already_member'
        ? t('friends.err_already')
        : e?.error === 'group_full'
          ? t('friends.err_full')
          : t('friends.err_generic');
      toast.error(msg);
    }
  };

  return (
    <div className="sUp" style={{ paddingBottom: isDesktop ? 32 : 96 }}>
      {/* Heading */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{
          fontFamily: "'Playfair Display',serif", fontSize: isDesktop ? 32 : 24,
          fontWeight: 900, letterSpacing: -0.5, marginBottom: 4,
        }}>👥 {t('friends.title')}</h1>
        <div style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.5 }}>
          {t('friends.subtitle')}
        </div>
      </div>

      {/* Search */}
      {friends.length > 4 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', marginBottom: 14,
          background: 'var(--card)', border: '1px solid var(--brd)',
          borderRadius: 12,
        }}>
          <span style={{ color: 'var(--dim)', fontSize: 14 }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('friends.search')}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--txt)',
              fontFamily: "'Syne',sans-serif", fontSize: 13,
            }}
          />
        </div>
      )}

      {/* Body */}
      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--dim)', fontSize: 12 }}>
          {t('friends.loading')}
        </div>
      )}

      {!loading && error && (
        <div style={{
          padding: 16, borderRadius: 12,
          border: '1px solid var(--red)44', background: 'var(--red)10',
          color: 'var(--red)', fontSize: 12, textAlign: 'center',
        }}>
          {t('friends.err_load')}
          <button onClick={load} style={{
            display: 'block', margin: '10px auto 0',
            padding: '7px 14px', borderRadius: 10,
            background: 'transparent', border: '1px solid var(--red)',
            color: 'var(--red)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>{t('photo.retry')}</button>
        </div>
      )}

      {!loading && !error && friends.length === 0 && (
        <div style={{
          padding: '48px 16px', textAlign: 'center',
          border: '1px dashed var(--brd)', borderRadius: 16, color: 'var(--dim)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>
            {t('friends.empty_title')}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>
            {t('friends.empty_body')}
          </div>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && friends.length > 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--dim)', fontSize: 12 }}>
          {t('friends.no_results')}
        </div>
      )}

      {!loading && !error && filtered.map(f => (
        <div key={f.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', marginBottom: 10,
          background: 'var(--card)', border: '1px solid var(--brd)',
          borderRadius: 14,
        }}>
          <Avatar p={f} size={48}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{f.name}</div>

            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6,
            }}>
              {(f.shared_groups || []).slice(0, 4).map(g => (
                <span key={g.id}
                  onClick={() => onSwitchToGroup?.(g.id)}
                  title={g.name}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 999,
                    background: 'var(--gold)12', border: '1px solid var(--gold)33',
                    fontSize: 10, color: 'var(--gold)', fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{g.emoji} {g.name}</span>
              ))}
              {f.shared_groups?.length > 4 && (
                <span style={{ fontSize: 10, color: 'var(--mut)', padding: '3px 4px' }}>
                  +{f.shared_groups.length - 4}
                </span>
              )}
            </div>

            {f.last_interaction > 0 && (
              <div style={{ fontSize: 10, color: 'var(--mut)', marginTop: 6, letterSpacing: 0.3 }}>
                ⏱ {timeAgo(f.last_interaction, t)}
              </div>
            )}
          </div>

          <button onClick={() => setInviting(f)}
            title={t('friends.invite_btn')}
            style={{
              padding: '8px 12px', borderRadius: 10,
              background: 'var(--gold)22', border: '1px solid var(--gold)55',
              color: 'var(--gold)', cursor: 'pointer',
              fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
              letterSpacing: 0.5, flexShrink: 0,
              transition: 'all .18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)35'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)22'; }}
          >
            ＋ {t('friends.invite_short')}
          </button>
        </div>
      ))}

      {inviting && (
        <InviteToGroupModal
          friend={inviting}
          groups={groups}
          onInvite={handleInvite}
          onClose={() => setInviting(null)}
        />
      )}
    </div>
  );
}
