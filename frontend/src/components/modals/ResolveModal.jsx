import React, { useState } from 'react';
import { Btn, Avatar, fmtQ, qToP, COLORS } from '../Atoms.jsx';
import { useLang } from '../../i18n.js';

// Shared modal shell — dark overlay, centered editorial panel.
const OVERLAY = {position:"fixed",inset:0,background:"rgba(15,11,35,.78)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:24};
const PANEL   = {background:"var(--surf)",border:"1px solid var(--rule)",borderRadius:6,padding:"32px 30px",boxShadow:"0 30px 80px rgba(0,0,0,.55)"};

const Bdg = ({c,bg,children}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:999,fontSize:10,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",background:bg,color:c}}>{children}</span>
);

export function ResolveModal({bet,cats,profiles,onResolve,onOvertime,onClose}){
  const { t } = useLang();
  const [done,setDone]=useState(false);
  const go = o => { setDone(true); setTimeout(()=>onResolve(bet,o),200); };
  const cbs = bet.counterBets || [];

  return(
    <div style={OVERLAY} onClick={onClose}>
      <div className="bIn" style={{...PANEL, width:"100%", maxWidth:420}} onClick={e=>e.stopPropagation()}>
        {/* Meta + title — editorial header */}
        <div className="bc-meta" style={{marginBottom:10}}>— {t('resolve.title')}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:26,fontWeight:600,lineHeight:1.15,letterSpacing:"-0.01em",marginBottom:22,color:"var(--txt)"}}>
          “{bet.title}”
        </div>

        {/* Numbers row — separated by vertical hairlines */}
        <div style={{display:"flex",marginBottom:cbs.length>0?20:28,borderTop:"1px solid var(--rule)",borderBottom:"1px solid var(--rule)",padding:"16px 0"}}>
          {[
            {l:t('resolve.quota'), v:`${fmtQ(bet.quota)}×`,         c:"var(--gold)"},
            {l:t('resolve.stake'), v:`${bet.stake} ₡`,               c:"var(--txt)"},
            {l:t('resolve.win'),   v:`${bet.potentialWin} ₡`,        c:"var(--grn)"},
          ].map((s,i,arr) => (
            <div key={s.l} style={{flex:1, textAlign:i===0?"left":i===arr.length-1?"right":"center", borderLeft:i===0?"none":"1px solid var(--rule)", paddingLeft:i===0?0:14}}>
              <div className="bc-num" style={{fontSize:24, color:s.c}}>{s.v}</div>
              <div className="bc-meta" style={{marginTop:6, fontSize:8}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Counter positions — pure type, no card frame */}
        {cbs.length>0 && (
          <div style={{marginBottom:24}}>
            <div className="bc-meta" style={{marginBottom:10}}>{t('resolve.positions')}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Bdg bg="var(--grn)18" c="var(--grn)">{profiles[bet.creator]?.avatar} {t('resolve.yes')} · {bet.stake}₡</Bdg>
              {cbs.map(cb=>(
                <Bdg key={cb.bettor} bg={cb.side==="yes"?"var(--grn)18":"var(--red)18"} c={cb.side==="yes"?"var(--grn)":"var(--red)"}>
                  {profiles[cb.bettor]?.avatar} {cb.side==="yes"?t('resolve.yes'):t('resolve.no')} · {cb.stake}₡
                </Bdg>
              ))}
            </div>
          </div>
        )}

        {/* Decisions — stacked pills, primary states obvious */}
        <Btn variant="grn" full style={{marginBottom:10}} disabled={done} onClick={()=>go("won")}>
          {t('resolve.yes_btn',{net:bet.potentialWin-bet.stake})}
        </Btn>
        <Btn variant="red" full style={{marginBottom:18}} disabled={done} onClick={()=>go("lost")}>
          {t('resolve.no_btn',{stake:bet.stake})}
        </Btn>

        {/* Overtime — written as a quiet link, not a third heavy CTA */}
        <button disabled={done} onClick={()=>onOvertime(bet)} style={{
          width:"100%", padding:"4px 0", marginBottom:14,
          background:"transparent", border:"none", cursor:"pointer",
          fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:600,
          letterSpacing:".22em", textTransform:"uppercase", color:"#f97316",
        }}>{t('resolve.overtime')}</button>

        <button onClick={onClose} style={{
          width:"100%", padding:"4px 0",
          background:"transparent", border:"none", cursor:"pointer",
          fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:600,
          letterSpacing:".3em", textTransform:"uppercase", color:"var(--dim)",
        }}>{t('resolve.cancel')}</button>
      </div>
    </div>
  );
}

export function OvertimeModal({bet,profiles,onResult,onClose}){
  const { t } = useLang();
  const [phase,setPhase]=useState("ready");
  const [winner,setWinner]=useState(null);
  const flip=()=>{
    setPhase("flipping");
    setTimeout(()=>{
      const w=Math.random()<.5?bet.creator:(Object.keys(profiles).find(k=>k!==bet.creator)??bet.creator);
      setWinner(w);setPhase("result");
    },1600);
  };
  return(
    <div style={OVERLAY} onClick={onClose}>
      <div className="bIn" style={{...PANEL,width:"100%",maxWidth:380,textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div className="bc-meta" style={{marginBottom:10}}>— {t('overtime.title')}</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:24,fontWeight:600,lineHeight:1.15,marginBottom:6,color:"var(--txt)"}}>
          “{bet.title}”
        </div>
        <div style={{fontSize:12,color:"var(--dim)",marginBottom:28,letterSpacing:".02em"}}>{t('overtime.desc')}</div>

        <div style={{fontSize:88,marginBottom:28,display:"inline-block"}} className={phase==="flipping"?"spinC":""}>🪙</div>

        {phase==="ready" && <Btn variant="gold" style={{padding:"13px 36px"}} onClick={flip}>{t('overtime.flip')}</Btn>}
        {phase==="flipping" && <div className="bc-meta" style={{fontSize:11}}>{t('overtime.flipping')}</div>}

        {phase==="result" && winner && (
          <div className="bIn">
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:28,fontWeight:600,color:"var(--gold)",marginBottom:8,letterSpacing:"-0.01em"}}>
              {profiles[winner]?.avatar} {profiles[winner]?.name} {t('overtime.winner')}
            </div>
            <div style={{fontSize:12,color:"var(--dim)",marginBottom:24}}>{t('overtime.fate')}</div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="grn" style={{flex:1}} onClick={()=>onResult(bet,winner===bet.creator?"won":"lost")}>{t('overtime.accept')}</Btn>
              <Btn variant="ghost" style={{flex:1}} onClick={onClose}>{t('overtime.close')}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
