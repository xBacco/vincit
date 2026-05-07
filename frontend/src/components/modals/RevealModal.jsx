import React, { useState } from 'react';
import { Btn, fmtQ, qToP, fmtD } from '../Atoms.jsx';
import { useLang } from '../../i18n.js';

const S = {
  card: {background:"var(--card)",border:"1px solid var(--brd)",borderRadius:16,padding:16},
  bdg: {display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600},
};

const Bdg=({c,bg,children})=><span style={{...S.bdg,background:bg,color:c}}>{children}</span>;

export default function RevealModal({bet,cats,onResolve,onClose}){
  const { t, lang } = useLang();
  const [flipped,setFlipped]=useState(false);
  const [done,setDone]=useState(false);
  const cat=cats.find(c=>c.id===bet.category)||cats[cats.length-1];
  const go=outcome=>{setDone(true);setTimeout(()=>onResolve(bet,outcome),200);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.94)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:100,padding:28}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"var(--gold)",marginBottom:6,textAlign:"center"}}>{t('reveal.title')}</div>
      <div style={{fontSize:12,color:"var(--dim)",marginBottom:36}}>{t('reveal.created')} {fmtD(bet.createdAt,lang)}</div>
      <div style={{perspective:900,width:280,height:180,marginBottom:32}}>
        <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transition:"transform .65s cubic-bezier(.34,1.2,.64,1)",transform:flipped?"rotateY(180deg)":"rotateY(0)"}}>
          <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",borderRadius:18,background:"linear-gradient(135deg,var(--card),var(--surf))",border:"2px solid var(--gold)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer"}} onClick={()=>setFlipped(true)}>
            <div style={{fontSize:48}}>🔒</div>
            <div style={{fontSize:14,color:"var(--gold)",fontWeight:600}}>{t('reveal.tap')}</div>
          </div>
          <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:18,padding:20,background:"linear-gradient(135deg,var(--surf),var(--card))",border:`2px solid ${cat.color}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
            <div style={{fontSize:24}}>{cat.e}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,textAlign:"center",lineHeight:1.3,color:"var(--txt)"}}>{bet.title}</div>
            <div style={{display:"flex",gap:8}}><Bdg bg="var(--gold)22" c="var(--gold)">{fmtQ(bet.quota)}×</Bdg><Bdg bg="var(--mut)44" c="var(--dim)">{qToP(bet.quota)}%</Bdg></div>
            <div style={{fontSize:11,color:"var(--dim)"}}>{t('bet_card.stake')} {bet.stake} ₡ → {t('bet_card.win')} {bet.potentialWin} ₡</div>
          </div>
        </div>
      </div>
      {flipped&&!done&&(
        <div className="bIn" style={{textAlign:"center",width:"100%",maxWidth:320}}>
          <div style={{fontSize:14,color:"var(--dim)",marginBottom:14}}>{t('reveal.happened')}</div>
          <div style={{display:"flex",gap:12}}>
            <Btn variant="grn" style={{flex:1,padding:"13px 0",fontSize:15}} onClick={()=>go("won")}>{t('reveal.yes_btn')}</Btn>
            <Btn variant="red" style={{flex:1,padding:"13px 0",fontSize:15}} onClick={()=>go("lost")}>{t('reveal.no_btn')}</Btn>
          </div>
        </div>
      )}
      {!flipped&&<Btn variant="ghost" sm style={{marginTop:8}} onClick={onClose}>{t('reveal.cancel')}</Btn>}
    </div>
  );
}
