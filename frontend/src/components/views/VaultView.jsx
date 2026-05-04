import React from 'react';
import { Btn, SecLabel, Avatar, COLORS, getC } from '../Atoms.jsx';
import BetCard from '../BetCard.jsx';

const S = {
  card: {background:"var(--card)",border:"1px solid var(--brd)",borderRadius:16,padding:16},
  btn: {display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 18px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:600,transition:"all .18s",userSelect:"none",whiteSpace:"nowrap"},
  bdg: {display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600},
};

const Bdg=({c,bg,children})=><span style={{...S.bdg,background:bg,color:c}}>{children}</span>;

const fmtD = ts=>new Date(ts).toLocaleDateString("it-IT",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const fmtQ = q=>parseFloat(q).toFixed(2);
const qToP = q=>Math.round(100/parseFloat(q));
const tLeft = ts=>{if(!ts)return null;const d=ts-Date.now();if(d<=0)return"SCADUTA";const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000);return h>=48?`${Math.floor(h/24)}g`:h>0?`${h}h${m}m`:`${m}m`;};
const isSoon= ts=>ts&&ts>Date.now()&&(ts-Date.now())<86400000;

export default function VaultView({user,profiles,bets,cats,onReveal,onFlame,unlocked,onPinRequest,vaultPin,isDesktop}){
  const active=bets.filter(b=>b.creator===user&&b.isSecret&&b.status==="active");
  const resolved=bets.filter(b=>b.creator===user&&b.isSecret&&["won","lost"].includes(b.status));
  const hasPIN=!!vaultPin;

  if(hasPIN&&!unlocked){
    return(
      <div className="sUp" style={{textAlign:"center",padding:"80px 20px"}}>
        <div style={{fontSize:52,marginBottom:16}}>🔒</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:8}}>Vault Protetto</div>
        <div style={{fontSize:13,color:"var(--dim)",marginBottom:28}}>Inserisci il PIN per accedere alle tue bet segrete</div>
        <Btn variant="gold" style={{padding:"12px 32px",fontSize:15}} onClick={onPinRequest}>Sblocca Vault</Btn>
      </div>
    );
  }

  return(
    <div className="sUp">
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,marginBottom:4}}>🔒 Vault Segreto</div>
      <div style={{fontSize:13,color:"var(--dim)",marginBottom:8}}>Solo tu vedi queste bet</div>
      <div style={{fontSize:11,color:"var(--gold)",padding:"10px 12px",background:"var(--gold)10",borderRadius:10,border:"1px solid var(--gold)30",marginBottom:20,lineHeight:1.5}}>
        ✦ Il timestamp di creazione è la tua prova di onestà — non puoi creare una bet dopo che l'evento è già accaduto
      </div>
      {active.length===0&&resolved.length===0&&(
        <div style={{textAlign:"center",padding:"52px 0",color:"var(--dim)"}}>
          <div style={{fontSize:48,marginBottom:12}}>🔒</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,marginBottom:6}}>Vault vuoto</div>
          <div style={{fontSize:13}}>Crea una bet segreta per iniziare</div>
        </div>
      )}
      {active.map(b=>{
        const cat=cats.find(c=>c.id===b.category)||cats[cats.length-1];
        return(
          <div key={b.id} className="sUp" style={{...S.card,marginBottom:10,border:"1px solid var(--gold)44",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"var(--gold)"}}/>
            <div style={{paddingLeft:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14,lineHeight:1.35}}>{b.title}</div>
                  <div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>🔒 Sigillata · {fmtD(b.createdAt)}</div>
                  {b.expiresAt&&<div style={{fontSize:11,color:isSoon(b.expiresAt)?"var(--red)":"var(--gold)",marginTop:2}}>⏱ {tLeft(b.expiresAt)}</div>}
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"var(--gold)",fontWeight:700}}>{fmtQ(b.quota)}×</div>
                  <div style={{fontSize:10,color:"var(--dim)"}}>{qToP(b.quota)}%</div>
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                <Bdg bg="var(--mut)44" c="var(--dim)">{cat.e} {cat.label}</Bdg>
                <Bdg bg="var(--mut)44" c="var(--dim)">Stake {b.stake} ₡</Bdg>
                <Bdg bg="var(--grn)22" c="var(--grn)">Win {b.potentialWin} ₡</Bdg>
                {b.pegno&&<Bdg bg="var(--gold)22" c="var(--gold)">🎁 {b.pegno}</Bdg>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn variant="gold" sm style={{flex:1}} onClick={()=>onReveal(b)}>🔓 Rivela Bet</Btn>
                <button onClick={()=>onFlame(b.id)} style={{...S.btn,padding:"7px 10px",background:"transparent",border:"1px solid var(--brd)",color:b.flamed?"#f97316":"var(--dim)",fontSize:12}}>{b.flamed?"🔥":"🤍"}</button>
              </div>
            </div>
          </div>
        );
      })}
      {resolved.length>0&&<><SecLabel mt={16}>Risolte</SecLabel>{resolved.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={()=>{}} isDesktop={isDesktop}/>)}</>}
    </div>
  );
}
