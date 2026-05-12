import React from 'react';
import { useLang } from '../../i18n.js';
import TrophiesSection from '../TrophiesSection.jsx';

export default function TrophiesModal({ onClose, betsTick = 0 }) {
  const { t } = useLang();
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.88)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:120, padding:'env(safe-area-inset-top, 16px) 12px env(safe-area-inset-bottom, 16px)',
    }}>
      <div className="bIn" onClick={e => e.stopPropagation()} style={{
        background:'var(--surf)',
        border:'1px solid var(--brd)',
        borderRadius:18,
        width:'100%',
        maxWidth:760,
        maxHeight:'92vh',
        display:'flex',
        flexDirection:'column',
        boxShadow:'0 24px 64px rgba(0,0,0,.6)',
      }}>
        {/* Sticky header */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'16px 20px',
          borderBottom:'1px solid var(--brd)',
          flexShrink:0,
          background:'linear-gradient(180deg, var(--surf), var(--card))',
          borderRadius:'18px 18px 0 0',
        }}>
          <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700}}>
            {t('trophies.title')}
          </div>
          <button onClick={onClose} style={{
            background:'transparent', border:'1px solid var(--brd)', borderRadius:10,
            color:'var(--dim)', padding:'6px 12px', cursor:'pointer',
            fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600,
          }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{padding:'16px 20px 24px', overflowY:'auto'}}>
          <TrophiesSection embedded={false} betsTick={betsTick} />
        </div>
      </div>
    </div>
  );
}
