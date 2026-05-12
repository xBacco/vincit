import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Btn, COLORS } from '../Atoms.jsx';
import { useLang } from '../../i18n.js';

/**
 * Modal shown when an opponent decides to accept a targeted bet.
 * They choose their stake (default = creator\'s stake). Winner takes the
 * combined pot (creator\'s stake + opponent\'s stake) at resolution.
 */
export default function AcceptModal({ bet, profiles, myCredits, onAccept, onClose }) {
  const { t } = useLang();
  const suggested = bet.stake;
  const maxStake  = Math.max(1, Math.floor(myCredits));
  const [stake, setStake] = useState(Math.min(suggested, maxStake));
  const [busy, setBusy]   = useState(false);
  const creatorProfile    = profiles[bet.creator] || {};
  const creatorColor      = COLORS[creatorProfile.colorKey] || '#5b8af0';

  const handleConfirm = async () => {
    if (stake < 1 || stake > maxStake) return;
    setBusy(true);
    try { await onAccept(bet.id, { stake }); onClose(); }
    finally { setBusy(false); }
  };

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9300, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} className="bIn" style={{
        background: 'var(--surf)', border: '1px solid var(--brd)',
        borderRadius: 18, width: '100%', maxWidth: 460,
        boxShadow: '0 24px 64px rgba(0,0,0,.6)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--brd)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700 }}>
            🎯 {t('accept.title')}
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--brd)', borderRadius: 10,
            color: 'var(--dim)', padding: '5px 11px', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
          }}>✕</button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {/* Creator + bet summary */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', marginBottom: 14,
            background: 'var(--card)', border: '1px solid var(--brd)',
            borderRadius: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `${creatorColor}33`, border: `2px solid ${creatorColor}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, overflow: 'hidden', flexShrink: 0,
            }}>
              {creatorProfile.avatarUrl
                ? <img src={creatorProfile.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : (creatorProfile.avatar || '😊')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {t('accept.from', { name: creatorProfile.name || '—' })}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, lineHeight: 1.3 }}>
                {bet.title}
              </div>
            </div>
          </div>

          {/* Their stake */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontSize: 12, color: 'var(--dim)', marginBottom: 4,
          }}>
            <span>{t('accept.creator_stake')}</span>
            <span style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 700 }}>{bet.stake} ₡</span>
          </div>

          {/* My stake */}
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 8 }}>
              {t('accept.your_stake')}
            </label>
            <input
              type="range"
              min={1} max={maxStake} step={1}
              value={stake}
              onChange={e => setStake(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <button onClick={() => setStake(Math.min(suggested, maxStake))} style={{
                background: 'transparent', border: '1px solid var(--brd)', borderRadius: 8,
                padding: '4px 10px', fontSize: 11, color: 'var(--dim)', cursor: 'pointer',
                fontFamily: "'Syne',sans-serif",
              }}>= {suggested} ₡ ({t('accept.match')})</button>
              <input
                type="number"
                min={1} max={maxStake}
                value={stake}
                onChange={e => setStake(Math.max(1, Math.min(maxStake, parseInt(e.target.value, 10) || 1)))}
                style={{
                  width: 100, textAlign: 'right',
                  background: 'var(--inp)', border: '1px solid var(--brd)', borderRadius: 8,
                  color: 'var(--gold)', padding: '6px 10px', fontWeight: 700,
                  fontFamily: "'Syne',sans-serif", fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--mut)', marginTop: 6 }}>
              {t('accept.max_avail', { n: maxStake })}
            </div>
          </div>

          {/* Pot summary */}
          <div style={{
            marginTop: 14, padding: '12px 14px',
            background: 'var(--gold)10', border: '1px solid var(--gold)44',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
              {t('accept.pot_label')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dim)', marginBottom: 4 }}>
              <span>{t('accept.if_you_win')}</span>
              <span style={{ color: 'var(--grn)', fontWeight: 700, fontSize: 14 }}>+{bet.stake} ₡</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dim)' }}>
              <span>{t('accept.if_you_lose')}</span>
              <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 14 }}>−{stake} ₡</span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 8, padding: '12px 18px',
          borderTop: '1px solid var(--brd)', justifyContent: 'flex-end',
        }}>
          <Btn variant="ghost" onClick={onClose}>{t('reveal.cancel')}</Btn>
          <Btn variant="gold" onClick={handleConfirm} disabled={busy || stake < 1 || stake > maxStake}
               style={{padding: '10px 22px'}}>
            {busy ? '…' : t('accept.confirm')}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
}
