import React, { useState } from 'react';
import { Btn, Inp } from '../Atoms.jsx';
import { useLang } from '../../i18n.js';
import * as api from '../../api.js';

export default function PairingView({ user, onPaired }) {
  const { t } = useLang();
  const [code, setCode]     = useState('');
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(user.invite_code || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleJoin = async () => {
    if (code.length < 6) return;
    setError('');
    setLoading(true);
    try {
      const result = await api.joinRoom(code);
      onPaired(result);
    } catch (err) {
      if (err.data?.error === 'own_room')      setError(t('pairing.err_own'));
      else if (err.data?.error === 'already_paired') setError(t('pairing.err_paired'));
      else setError(t('pairing.err_invalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:900, marginBottom:6 }}>
            <span className="shim">BetCouple</span>
          </div>
          <div style={{ fontSize:22, marginTop:4 }}>👋 {user.name}</div>
        </div>

        {/* Your invite code */}
        <div style={{ background:'var(--card)', border:'1px solid var(--brd)', borderRadius:20, padding:28, marginBottom:20, textAlign:'center' }}>
          <div style={{ fontSize:11, color:'var(--dim)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
            {t('pairing.your_code')}
          </div>
          <div style={{ fontFamily:'monospace', fontSize:36, fontWeight:700, color:'var(--gold)', letterSpacing:8, marginBottom:8 }}>
            {user.invite_code || '------'}
          </div>
          <div style={{ fontSize:12, color:'var(--dim)', marginBottom:16 }}>{t('pairing.share_hint')}</div>
          <button onClick={handleCopy}
            style={{ padding:'8px 20px', borderRadius:10, border:'1px solid var(--brd)', background:'transparent',
              color: copied ? 'var(--grn)' : 'var(--dim)', cursor:'pointer',
              fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, transition:'all .18s' }}>
            {copied ? t('pairing.copied') : t('pairing.copy_btn')}
          </button>
        </div>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:'var(--brd)' }} />
          <span style={{ fontSize:13, color:'var(--dim)' }}>{t('pairing.or')}</span>
          <div style={{ flex:1, height:1, background:'var(--brd)' }} />
        </div>

        {/* Enter partner's code */}
        <div style={{ background:'var(--card)', border:'1px solid var(--brd)', borderRadius:20, padding:28 }}>
          <div style={{ fontSize:11, color:'var(--dim)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
            {t('pairing.join_ph')}
          </div>
          <Inp
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0,6)); setError(''); }}
            placeholder={t('pairing.join_ph')}
            style={{ textAlign:'center', letterSpacing:6, fontSize:24, fontFamily:'monospace', marginBottom:12 }}
          />
          {error && <div style={{ fontSize:13, color:'var(--red)', marginBottom:12 }}>{error}</div>}
          <button onClick={handleJoin} disabled={code.length < 6 || loading}
            style={{ width:'100%', padding:'12px 0', borderRadius:12, border:'none',
              background: code.length >= 6 ? 'var(--gold)' : 'var(--mut)',
              color: code.length >= 6 ? '#07060f' : 'var(--dim)',
              fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700,
              cursor: code.length >= 6 ? 'pointer' : 'default',
              opacity: loading ? 0.7 : 1, transition:'all .18s' }}>
            {loading ? '…' : t('pairing.join_btn')}
          </button>
        </div>
      </div>
    </div>
  );
}
