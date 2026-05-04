import React from 'react';
import { Avatar, COLORS, getC } from '../Atoms.jsx';

export default function WelcomeScreen({profiles,onSelect}){
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,background:"var(--bg)"}}>
      <div style={{fontSize:11,letterSpacing:3,color:"var(--dim)",textTransform:"uppercase",marginBottom:8}}>Privato · Solo per voi</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,marginBottom:6}}><span className="shim">BetCouple</span></div>
      <div style={{fontSize:13,color:"var(--dim)",marginBottom:44,textAlign:"center"}}>Il vostro gioco privato di scommesse</div>
      <div style={{display:"flex",gap:16,width:"100%",maxWidth:360}}>
        {["tomas","giulia"].map(k=>{
          const p=profiles[k]; const c=COLORS[p.colorKey]||"#5b8af0";
          return(
            <div key={k} onClick={()=>onSelect(k)} style={{flex:1,background:"var(--card)",borderRadius:20,padding:"28px 14px",textAlign:"center",cursor:"pointer",border:`2px solid var(--brd)`,transition:"all .22s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c;e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 10px 32px ${c}44`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--brd)";e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
              <div style={{fontSize:44,marginBottom:10}}>{p.avatar}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700}}>{p.name}</div>
              <div style={{fontSize:12,color:"var(--dim)",marginTop:4}}>Sono io</div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:32,fontSize:11,color:"var(--mut)",textAlign:"center",lineHeight:1.8}}>Quote decimali europee · Dati salvati in sessione</div>
    </div>
  );
}
