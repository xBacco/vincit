import { useState } from "react";

const DARK  = {bg:"#07060f",surf:"#0f0d1f",card:"#131128",brd:"#1e1b36",gold:"#c8973f",goldL:"#e8b84b",glow:"rgba(200,151,63,0.18)",grn:"#2ecc7f",red:"#e05555",blu:"#5b8af0",pur:"#a07ef5",txt:"#ede8fd",dim:"#8480a0",mut:"#3d3a58",inp:"#0f0d1f"};
const LIGHT = {bg:"#f0eeff",surf:"#ffffff",card:"#fafafe",brd:"#dbd6f0",gold:"#9a6820",goldL:"#b8801e",glow:"rgba(154,104,32,0.15)",grn:"#1a8f5c",red:"#c03040",blu:"#2a5fcc",pur:"#6b48cc",txt:"#1a1630",dim:"#5a5478",mut:"#d0cce8",inp:"#f8f6ff"};

// Static CSS — only animations + structural resets. Colors come from inline CSS vars on root.
const CSS_BASE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Syne:wght@400;500;600;700&display=swap');
@keyframes sUp{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fIn{from{opacity:0}to{opacity:1}}
@keyframes bIn{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.1)}80%{transform:scale(.95)}100%{transform:scale(1);opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes pGold{0%,100%{box-shadow:0 0 0 0 var(--glow)}50%{box-shadow:0 0 22px 4px var(--glow)}}
@keyframes spinC{0%{transform:rotateY(0deg)}100%{transform:rotateY(1800deg)}}
@keyframes confA{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(90px) rotate(720deg);opacity:0}}
.bc *{box-sizing:border-box;margin:0;padding:0}
.bc{font-family:'Syne',sans-serif;transition:background .25s,color .25s}
.sUp{animation:sUp .3s ease both}
.fIn{animation:fIn .25s ease both}
.bIn{animation:bIn .45s cubic-bezier(.34,1.56,.64,1) both}
.pGold{animation:pGold 3s ease-in-out infinite}
.shim{background:linear-gradient(90deg,var(--gold) 0%,var(--goldL) 50%,var(--gold) 100%);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 2.5s linear infinite}
.spinC{animation:spinC 1.4s ease-in-out forwards}
.confp{position:absolute;border-radius:2px;animation:confA 1.2s ease-out forwards}
.bc input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:3px;background:var(--mut);outline:none;cursor:pointer}
.bc input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--gold);cursor:pointer;box-shadow:0 0 8px var(--glow)}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:var(--mut);border-radius:2px}
`;

// CSS vars applied as inline style on root — always works regardless of sandbox CSP
const rootVars = C => ({
  "--bg":C.bg,"--surf":C.surf,"--card":C.card,"--brd":C.brd,
  "--gold":C.gold,"--goldL":C.goldL,"--glow":C.glow,
  "--grn":C.grn,"--red":C.red,"--blu":C.blu,"--pur":C.pur,
  "--txt":C.txt,"--dim":C.dim,"--mut":C.mut,"--inp":C.inp,
  background:C.bg, color:C.txt,
  fontFamily:"'Syne',sans-serif", minHeight:"100vh",
});

let _uid=1; const uid=()=>`b${_uid++}`;
const AVATARS=["🃏","♥️","🎲","🦁","🐺","🔥","⚡","🌙","🎭","🦊","🐉","💎","⭐","🏆","🎯","🍷","🎸","🦋","🐬","🦅","🌺","🐻","🎪","🎠"];
const COLORS={blue:"#5b8af0",purple:"#a07ef5",green:"#2ecc7f",red:"#e05555",gold:"#c8973f",pink:"#e878a8",teal:"#2ec8c8",orange:"#e8903f"};
const CAT_COLS=["#e05555","#a07ef5","#5b8af0","#e8903f","#2ecc7f","#e878a8","#f6c90e","#2ec8c8"];
const DEF_CATS=[
  {id:"intimo",e:"💋",label:"Intimo",color:"#e05555"},
  {id:"serata",e:"🌙",label:"Serata",color:"#a07ef5"},
  {id:"casa",  e:"🏠",label:"Casa",  color:"#5b8af0"},
  {id:"cibo",  e:"🍕",label:"Cibo",  color:"#e8903f"},
  {id:"gaming",e:"🎮",label:"Gaming",color:"#2ecc7f"},
  {id:"altro", e:"🎲",label:"Altro", color:"#8480a0"},
];
const Q_PRE=[
  {l:"👑 Quasi certo",q:1.10},{l:"🔥 Molto prob.",q:1.30},
  {l:"⚡ Probabile",  q:1.50},{l:"🎲 Fifty-fifty",q:2.00},
  {l:"💀 Outsider",   q:3.50},{l:"🌙 Miracolo",   q:6.00},
];

const qToP  = q=>Math.round(100/parseFloat(q));
const pToQ  = p=>parseFloat((100/Math.max(1,Math.min(99,p))).toFixed(2));
const fmtQ  = q=>parseFloat(q).toFixed(2);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const fmtD  = ts=>new Date(ts).toLocaleDateString("it-IT",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const qNo   = qY=>parseFloat((parseFloat(qY)/(parseFloat(qY)-1)).toFixed(2));
const tLeft = ts=>{if(!ts)return null;const d=ts-Date.now();if(d<=0)return"SCADUTA";const h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000);return h>=48?`${Math.floor(h/24)}g`:h>0?`${h}h${m}m`:`${m}m`;};
const isSoon= ts=>ts&&ts>Date.now()&&(ts-Date.now())<86400000;
const getC  = (profiles,user)=>COLORS[profiles[user].colorKey]||"#5b8af0";

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
const S = {
  card: {background:"var(--card)",border:"1px solid var(--brd)",borderRadius:16,padding:16},
  bdg: {display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600},
  btn: {display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 18px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:600,transition:"all .18s",userSelect:"none",whiteSpace:"nowrap"},
  row: {display:"flex",alignItems:"center",gap:10},
  col: {display:"flex",flexDirection:"column",gap:6},
  lbl: {fontSize:10,color:"var(--dim)",letterSpacing:2,textTransform:"uppercase",display:"block",marginBottom:6},
  inp: {background:"var(--inp)",border:"1px solid var(--brd)",color:"var(--txt)",borderRadius:10,padding:"10px 14px",fontFamily:"'Syne',sans-serif",fontSize:14,outline:"none",width:"100%"},
};
const Bdg=({c,bg,children})=><span style={{...S.bdg,background:bg,color:c}}>{children}</span>;
const Btn=({variant="ghost",sm,full,onClick,disabled,children,style={}})=>{
  const base={...S.btn,...style};
  if(sm){base.padding="7px 13px";base.fontSize=12;}
  if(full){base.width="100%";base.padding="14px 0";base.fontSize=15;}
  if(disabled){base.opacity=.4;base.pointerEvents="none";}
  const vars={gold:{background:"var(--gold)",color:"#fff"},grn:{background:"var(--grn)",color:"#fff"},red:{background:"var(--red)",color:"#fff"},ghost:{background:"transparent",color:"var(--dim)",border:"1px solid var(--brd)"}};
  return <button style={{...base,...(vars[variant]||vars.ghost)}} onClick={onClick}>{children}</button>;
};
const Inp=({style={},value,onChange,placeholder,type="text",min,max,step})=>(
  <input type={type} style={{...S.inp,...style}} value={value} onChange={onChange} placeholder={placeholder} min={min} max={max} step={step}/>
);
const Toggle=({on,onToggle,color="var(--gold)"})=>(
  <div onClick={onToggle} style={{width:44,height:24,borderRadius:12,background:on?color:"var(--mut)",position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
    <div style={{position:"absolute",width:18,height:18,background:"#fff",borderRadius:"50%",top:3,left:on?23:3,transition:"left .2s"}}/>
  </div>
);
const SecLabel=({children,mt=0})=><div style={{fontSize:10,color:"var(--dim)",letterSpacing:2,textTransform:"uppercase",marginBottom:8,marginTop:mt}}>{children}</div>;

function Avatar({profile,size=36}){
  const c=COLORS[profile.colorKey]||"#5b8af0";
  return <div style={{width:size,height:size,borderRadius:"50%",background:`${c}33`,border:`2px solid ${c}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.42,flexShrink:0,boxShadow:`0 0 10px ${c}44`}}>{profile.avatar}</div>;
}

// ─── BET CARD ────────────────────────────────────────────────────────────────
function BetCard({bet,user,profiles,cats,onResolve,onReveal,onCounter,onFlame}){
  const other=user==="tomas"?"giulia":"tomas";
  const isOwner=bet.creator===user;
  const cat=cats.find(c=>c.id===bet.category)||cats[cats.length-1];
  const done=["won","lost"].includes(bet.status);
  const tl=tLeft(bet.expiresAt);
  const myCounter=(bet.counterBets||[]).find(cb=>cb.bettor===user);
  const theirCounter=(bet.counterBets||[]).find(cb=>cb.bettor!==user);
  const accentColor=isOwner?getC(profiles,user):getC(profiles,bet.creator);
  const sideColor=done?(bet.status==="won"?"var(--grn)":"var(--red)"):(bet.isSecret?"var(--gold)":cat.color);

  return(
    <div className="sUp" style={{...S.card,marginBottom:10,position:"relative",overflow:"hidden",opacity:done?0.78:1,border:`1px solid ${bet.isSecret?"var(--gold)44":"var(--brd)"}`}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:sideColor,borderRadius:"3px 0 0 3px"}}/>
      <div style={{paddingLeft:12}}>
        {/* Title row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
          <div style={{flex:1}}>
            {bet.isSecret&&!done
              ?<div style={{...S.row,gap:6}}><span>🔒</span><span style={{fontWeight:600,fontSize:14,color:"var(--gold)"}}>Bet Segreta</span></div>
              :<div style={{fontWeight:600,fontSize:14,lineHeight:1.35}}>{bet.title}</div>
            }
            <div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>
              {cat.e} {cat.label} · {fmtD(bet.createdAt)}
              {!isOwner&&<span style={{color:getC(profiles,bet.creator)}}> · {profiles[bet.creator].name}</span>}
            </div>
          </div>
          {!bet.isSecret&&<div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"var(--gold)"}}>{fmtQ(bet.quota)}×</div>
            <div style={{fontSize:10,color:"var(--dim)"}}>{qToP(bet.quota)}%</div>
          </div>}
        </div>

        {/* Badges */}
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
          {!bet.isSecret&&<><Bdg bg="var(--mut)44" c="var(--dim)">Stake {bet.stake} ₡</Bdg><Bdg bg="var(--grn)22" c="var(--grn)">Win {bet.potentialWin} ₡</Bdg></>}
          {bet.pegno&&<Bdg bg="var(--gold)22" c="var(--gold)">🎁 {bet.pegno}</Bdg>}
          {tl&&<Bdg bg={isSoon(bet.expiresAt)?"var(--red)22":"var(--mut)33"} c={isSoon(bet.expiresAt)?"var(--red)":"var(--dim)"}>⏱ {tl}</Bdg>}
          {done&&<Bdg bg={bet.status==="won"?"var(--grn)22":"var(--red)22"} c={bet.status==="won"?"var(--grn)":"var(--red)"}>{bet.status==="won"?`✅ +${bet.potentialWin-bet.stake} ₡`:`❌ −${bet.stake} ₡`}</Bdg>}
        </div>

        {/* Counter-bet section */}
        {!bet.isSecret&&!done&&bet.isCounterable&&(
          <div style={{borderTop:"1px solid var(--brd)",paddingTop:8,marginBottom:8}}>
            <div style={{fontSize:10,color:"var(--dim)",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Sfida diretta</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
              <Bdg bg="var(--grn)22" c="var(--grn)">{profiles[bet.creator].avatar} SÌ @ {fmtQ(bet.quota)}×</Bdg>
              {theirCounter&&<Bdg bg={theirCounter.side==="yes"?"var(--grn)22":"var(--red)22"} c={theirCounter.side==="yes"?"var(--grn)":"var(--red)"}>{profiles[theirCounter.bettor].avatar} {theirCounter.side==="yes"?"SÌ":"NO"} @ {fmtQ(theirCounter.quotaUsed)}×</Bdg>}
            </div>
            {!isOwner&&!myCounter&&<Btn variant="ghost" sm full onClick={()=>onCounter(bet)}>⚡ Scommetti SÌ {fmtQ(bet.quota)}× o NO {fmtQ(qNo(bet.quota))}×</Btn>}
            {!isOwner&&myCounter&&<div style={{fontSize:12,color:"var(--dim)",fontStyle:"italic"}}>La tua posizione: {myCounter.side==="yes"?"✅ SÌ":"❌ NO"} @ {fmtQ(myCounter.quotaUsed)}× · {myCounter.stake} ₡</div>}
          </div>
        )}

        {/* Actions */}
        {isOwner&&!done&&(
          <div style={{display:"flex",gap:8}}>
            {bet.isSecret
              ?<Btn variant="gold" sm style={{flex:1}} onClick={()=>onReveal(bet)}>🔓 Rivela</Btn>
              :<Btn variant="grn" sm style={{flex:1}} onClick={()=>onResolve(bet)}>Dichiara esito</Btn>
            }
            <button onClick={()=>onFlame(bet.id)} style={{...S.btn,padding:"7px 10px",background:"transparent",border:"1px solid var(--brd)",color:bet.flamed?"#f97316":"var(--dim)",fontSize:12}}>{bet.flamed?"🔥":"🤍"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WELCOME ─────────────────────────────────────────────────────────────────
function WelcomeScreen({profiles,onSelect}){
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({user,profiles,credits,bets,cats,onCreate,onResolve,onReveal,onCounter,onFlame,notifSince}){
  const other=user==="tomas"?"giulia":"tomas";
  const myWon=bets.filter(b=>b.creator===user&&b.status==="won");
  const myLost=bets.filter(b=>b.creator===user&&b.status==="lost");
  const thWon=bets.filter(b=>b.creator===other&&b.status==="won");
  const myAct=bets.filter(b=>b.creator===user&&!b.isSecret&&b.status==="active");
  const mySec=bets.filter(b=>b.creator===user&&b.isSecret&&b.status==="active");
  const thAct=bets.filter(b=>b.creator===other&&!b.isSecret&&b.status==="active");
  const newPart=bets.filter(b=>b.creator===other&&!b.isSecret&&b.createdAt>(notifSince[user]||0)).length;
  const expiring=bets.filter(b=>b.creator===user&&b.status==="active"&&isSoon(b.expiresAt));
  const wr=(myWon.length+myLost.length)?Math.round(myWon.length/(myWon.length+myLost.length)*100):0;
  const net=myWon.reduce((s,b)=>s+b.potentialWin-b.stake,0)-myLost.reduce((s,b)=>s+b.stake,0);
  const meC=getC(profiles,user); const otC=getC(profiles,other);

  return(
    <div className="sUp">
      {/* Partner notification */}
      {newPart>0&&(
        <div style={{...S.card,marginBottom:12,background:`var(--gold)14`,border:"1px solid var(--gold)44",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>{profiles[other].avatar}</span>
          <div>
            <div style={{fontWeight:600,fontSize:13,color:"var(--gold)"}}>{profiles[other].name} ha creato {newPart} nuova{newPart>1?"e":""} bet!</div>
            <div style={{fontSize:11,color:"var(--dim)"}}>Guarda le Bets Condivise</div>
          </div>
        </div>
      )}

      {/* Expiry alert */}
      {expiring.length>0&&(
        <div style={{...S.card,marginBottom:12,background:"var(--red)18",border:"1px solid var(--red)44"}}>
          <div style={{fontWeight:600,fontSize:13,color:"var(--red)",marginBottom:4}}>⏱ {expiring.length} bet in scadenza entro 24h!</div>
          {expiring.map(b=><div key={b.id} style={{fontSize:12,color:"var(--dim)",marginTop:2}}>· {b.title} — {tLeft(b.expiresAt)}</div>)}
        </div>
      )}

      {/* Score card */}
      <div className="card pGold" style={{...S.card,marginBottom:14,background:"linear-gradient(135deg,var(--card),var(--surf))"}}>
        <SecLabel>Classifica</SecLabel>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {[{k:user,p:profiles[user],c:meC,w:myWon.length},{k:other,p:profiles[other],c:otC,w:thWon.length}].map((s,i)=>(
            <div key={s.k} style={{flex:1,textAlign:"center"}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:`${s.c}33`,border:`2px solid ${s.c}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto"}}>{s.p.avatar}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginTop:6}}>{s.p.name}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:i===0?"var(--gold)":s.c,lineHeight:1.1}}>{s.w}</div>
              <div style={{fontSize:10,color:"var(--dim)"}}>vittorie</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:12,paddingTop:12,borderTop:"1px solid var(--brd)"}}>
          {[{l:"Win Rate",v:`${wr}%`,c:wr>=50?"var(--grn)":"var(--red)"},{l:"Crediti",v:`${Math.round(credits[user])} ₡`,c:"var(--gold)"},{l:"Bet tot.",v:myWon.length+myLost.length+myAct.length+mySec.length,c:"var(--txt)"}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:"var(--dim)"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vault teaser */}
      {mySec.length>0&&(
        <div style={{...S.card,marginBottom:14,border:"1px solid var(--gold)44",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"var(--gold)22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔒</div>
          <div>
            <div style={{fontWeight:600,fontSize:14,color:"var(--gold)"}}>Vault Segreto</div>
            <div style={{fontSize:12,color:"var(--dim)"}}>{mySec.length} bet privat{mySec.length===1?"a":"e"} — vai nel Vault per rivelare</div>
          </div>
        </div>
      )}

      {/* Active bets */}
      {myAct.length+thAct.length>0&&<><SecLabel>Bets attive</SecLabel>
        {myAct.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onResolve={onResolve} onFlame={onFlame} onCounter={onCounter}/>)}
        {thAct.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={onCounter}/>)}</>
      }

      {/* Empty */}
      {myAct.length+thAct.length+mySec.length===0&&(
        <div style={{textAlign:"center",padding:"52px 20px"}}>
          <div style={{fontSize:52,marginBottom:14}}>🎲</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:8}}>Nessuna bet attiva</div>
          <div style={{fontSize:13,color:"var(--dim)",marginBottom:24}}>Inizia a scommettere!</div>
          <Btn variant="gold" onClick={onCreate} style={{padding:"12px 28px",fontSize:15}}>+ Nuova Bet</Btn>
        </div>
      )}

      {/* Recent resolved */}
      {bets.filter(b=>b.creator===user&&["won","lost"].includes(b.status)).length>0&&(
        <><SecLabel mt={16}>Ultime risolte</SecLabel>
        {bets.filter(b=>b.creator===user&&["won","lost"].includes(b.status)).slice(-3).reverse().map(b=>(
          <BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={onCounter}/>
        ))}</>
      )}
    </div>
  );
}

// ─── BETS VIEW ────────────────────────────────────────────────────────────────
function BetsView({user,profiles,bets,cats,onResolve,onCounter,onFlame}){
  const other=user==="tomas"?"giulia":"tomas";
  const mine=bets.filter(b=>b.creator===user&&!b.isSecret&&b.status==="active");
  const theirs=bets.filter(b=>b.creator===other&&!b.isSecret&&b.status==="active");
  return(
    <div className="sUp">
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,marginBottom:4}}>🎯 Bets Condivise</div>
      <div style={{fontSize:13,color:"var(--dim)",marginBottom:20}}>{mine.length+theirs.length} attive in questo momento</div>
      {mine.length>0&&<><SecLabel>Le mie</SecLabel>{mine.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onResolve={onResolve} onFlame={onFlame} onCounter={onCounter}/>)}</>}
      {theirs.length>0&&<><SecLabel mt={14}>Di {profiles[other].name}</SecLabel>{theirs.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={onCounter}/>)}</>}
      {mine.length+theirs.length===0&&(
        <div style={{textAlign:"center",padding:"52px 0",color:"var(--dim)"}}>
          <div style={{fontSize:48,marginBottom:12}}>🎯</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:17}}>Nessuna bet condivisa attiva</div>
        </div>
      )}
    </div>
  );
}

// ─── VAULT VIEW ───────────────────────────────────────────────────────────────
function VaultView({user,profiles,bets,cats,onReveal,onFlame,unlocked,onPinRequest}){
  const active=bets.filter(b=>b.creator===user&&b.isSecret&&b.status==="active");
  const resolved=bets.filter(b=>b.creator===user&&b.isSecret&&["won","lost"].includes(b.status));
  const hasPIN=!!profiles[user].vaultPin;

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
      {resolved.length>0&&<><SecLabel mt={16}>Risolte</SecLabel>{resolved.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={()=>{}}/>)}</>}
    </div>
  );
}

// ─── STATS VIEW ───────────────────────────────────────────────────────────────
function StatsView({user,profiles,credits,bets,cats}){
  const won=bets.filter(b=>b.creator===user&&b.status==="won");
  const lost=bets.filter(b=>b.creator===user&&b.status==="lost");
  const all=[...won,...lost];
  const wr=all.length?Math.round(won.length/all.length*100):0;
  const net=won.reduce((s,b)=>s+b.potentialWin-b.stake,0)-lost.reduce((s,b)=>s+b.stake,0);
  const best=won.length?won.reduce((a,b)=>b.potentialWin>a.potentialWin?b:a):null;
  let streak=0,cur=0;
  [...bets].filter(b=>b.creator===user&&["won","lost"].includes(b.status)).sort((a,b)=>a.createdAt-b.createdAt).forEach(b=>{cur=b.status==="won"?cur+1:0;if(cur>streak)streak=cur;});
  const flamed=all.filter(b=>b.flamed);
  const catS=cats.map(c=>({...c,w:won.filter(b=>b.category===c.id).length,l:lost.filter(b=>b.category===c.id).length})).filter(c=>c.w+c.l>0);
  return(
    <div className="sUp">
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,marginBottom:20}}>📊 Statistiche</div>
      <div className="pGold" style={{...S.card,marginBottom:12,textAlign:"center",background:"linear-gradient(135deg,var(--card),var(--surf))"}}>
        <SecLabel>Saldo Attuale</SecLabel>
        <div className="shim" style={{fontFamily:"'Playfair Display',serif",fontSize:44,fontWeight:900}}>{Math.round(credits[user])} ₡</div>
        <div style={{fontSize:13,color:net>=0?"var(--grn)":"var(--red)",marginTop:6,fontWeight:600}}>{net>=0?"▲":"▼"} {Math.abs(net)} ₡ netti</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        {[{e:"✅",l:"Vinte",v:won.length,c:"var(--grn)"},{e:"❌",l:"Perse",v:lost.length,c:"var(--red)"},{e:"📈",l:"Win Rate",v:`${wr}%`,c:wr>=50?"var(--grn)":"var(--red)"},{e:"🔥",l:"Streak max",v:streak,c:"#f97316"}].map(s=>(
          <div key={s.l} style={{...S.card,textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:4}}>{s.e}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:"var(--dim)"}}>{s.l}</div>
          </div>
        ))}
      </div>
      {best&&(
        <div style={{...S.card,marginBottom:10,border:"1px solid var(--grn)33"}}>
          <SecLabel>🏆 Migliore Vittoria</SecLabel>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{best.title}</div>
          <div style={{display:"flex",gap:8}}><Bdg bg="var(--grn)22" c="var(--grn)">+{best.potentialWin-best.stake} ₡</Bdg><Bdg bg="var(--gold)22" c="var(--gold)">{fmtQ(best.quota)}×</Bdg></div>
        </div>
      )}
      {catS.length>0&&(
        <div style={{...S.card,marginBottom:10}}>
          <SecLabel>Per Categoria</SecLabel>
          {catS.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:14}}>{c.e}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12}}>{c.label}</div>
                <div style={{height:4,borderRadius:2,background:"var(--mut)",marginTop:4,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:2,background:c.color,width:`${(c.w+c.l)?c.w/(c.w+c.l)*100:0}%`,transition:"width .5s"}}/>
                </div>
              </div>
              <div style={{fontSize:11}}><span style={{color:"var(--grn)"}}>{c.w}V</span> <span style={{color:"var(--red)"}}>{c.l}P</span></div>
            </div>
          ))}
        </div>
      )}
      {flamed.length>0&&(
        <div style={{...S.card,border:"1px solid #f9731644"}}>
          <SecLabel>🔥 Hall of Fame</SecLabel>
          {flamed.map(b=>(
            <div key={b.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,paddingBottom:8,borderBottom:"1px solid var(--brd)"}}>
              <div style={{fontSize:13,flex:1,marginRight:8}}>{b.title}</div>
              <Bdg bg={b.status==="won"?"var(--grn)22":"var(--red)22"} c={b.status==="won"?"var(--grn)":"var(--red)"}>{b.status==="won"?"✅":"❌"}</Bdg>
            </div>
          ))}
        </div>
      )}
      {all.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:"var(--dim)",fontSize:13}}>Nessuna bet risolta — inizia a giocare!</div>}
    </div>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
function SettingsView({user,profiles,setProfiles,isDark,setIsDark,customCats,setCustomCats,credits,setCredits}){
  const [newE,setNewE]=useState("🎯");
  const [newLabel,setNewLabel]=useState("");
  const [newColor,setNewColor]=useState(CAT_COLS[0]);
  const [pinPhase,setPinPhase]=useState(null); // null|"set"|"remove-confirm"
  const [pin1,setPin1]=useState("");
  const [pin2,setPin2]=useState("");
  const [pinErr,setPinErr]=useState("");
  const [resetConfirm,setResetConfirm]=useState(false);

  const addCat=()=>{
    if(!newLabel.trim())return;
    setCustomCats(p=>[...p,{id:`c${Date.now()}`,e:newE,label:newLabel.trim(),color:newColor}]);
    setNewLabel("");
  };
  const savePin=()=>{
    if(pin1.length<4){setPinErr("Il PIN deve essere 4 cifre");return;}
    if(pin1!==pin2){setPinErr("I PIN non coincidono");return;}
    setProfiles(p=>({...p,[user]:{...p[user],vaultPin:pin1}}));
    setPinPhase(null);setPin1("");setPin2("");setPinErr("");
  };

  return(
    <div className="sUp">
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,marginBottom:20}}>⚙️ Impostazioni</div>

      {/* PROFILES */}
      <SecLabel>Profili</SecLabel>
      {["tomas","giulia"].map(k=>{
        const p=profiles[k]; const isMe=k===user;
        return(
          <div key={k} style={{...S.card,marginBottom:10,opacity:isMe?1:.65}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{fontSize:32}}>{p.avatar}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:"var(--dim)",marginBottom:4}}>{isMe?"Il tuo profilo":"Partner"}</div>
                <Inp value={p.name} disabled={!isMe} onChange={e=>setProfiles(pr=>({...pr,[k]:{...pr[k],name:e.target.value.slice(0,16)}}))} style={{fontWeight:600}}/>
              </div>
            </div>
            {isMe&&<>
              <div style={{fontSize:11,color:"var(--dim)",marginBottom:8}}>Avatar</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {AVATARS.map(a=>(
                  <div key={a} onClick={()=>setProfiles(pr=>({...pr,[k]:{...pr[k],avatar:a}}))} style={{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer",background:p.avatar===a?"var(--gold)22":"var(--surf)",border:`1px solid ${p.avatar===a?"var(--gold)":"var(--brd)"}`}}>{a}</div>
                ))}
              </div>
              <div style={{fontSize:11,color:"var(--dim)",marginBottom:8}}>Colore tema</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(COLORS).map(([k2,hex])=>(
                  <div key={k2} onClick={()=>setProfiles(pr=>({...pr,[k]:{...pr[k],colorKey:k2}}))} style={{width:26,height:26,borderRadius:"50%",background:hex,cursor:"pointer",border:`3px solid ${p.colorKey===k2?"#fff":"transparent"}`,boxShadow:p.colorKey===k2?`0 0 8px ${hex}`:"none"}}/>
                ))}
              </div>
            </>}
          </div>
        );
      })}

      {/* VAULT PIN */}
      <SecLabel mt={16}>Vault PIN (mio)</SecLabel>
      <div style={{...S.card,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>{profiles[user].vaultPin?"🔒 PIN attivo":"🔓 Nessun PIN"}</div>
            <div style={{fontSize:12,color:"var(--dim)",marginTop:2}}>Il vault è {profiles[user].vaultPin?"protetto":"accessibile"}</div>
            <div style={{fontSize:10,color:"var(--mut)",marginTop:4}}>⚠ Il PIN si resetta al ricaricamento della pagina</div>
          </div>
        </div>
        {pinErr&&<div style={{fontSize:12,color:"var(--red)",marginBottom:8}}>{pinErr}</div>}
        {pinPhase==="set"&&(
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:"var(--dim)",marginBottom:6}}>Nuovo PIN (4 cifre):</div>
            <Inp type="text" value={pin1} onChange={e=>setPin1(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="●●●●" style={{letterSpacing:8,fontSize:20,marginBottom:8}}/>
            <div style={{fontSize:12,color:"var(--dim)",marginBottom:6}}>Conferma PIN:</div>
            <Inp type="text" value={pin2} onChange={e=>setPin2(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="●●●●" style={{letterSpacing:8,fontSize:20,marginBottom:12}}/>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="gold" sm onClick={savePin}>Salva</Btn>
              <Btn variant="ghost" sm onClick={()=>{setPinPhase(null);setPin1("");setPin2("");setPinErr("");}}>Annulla</Btn>
            </div>
          </div>
        )}
        {!pinPhase&&(
          <div style={{display:"flex",gap:8}}>
            <Btn variant="ghost" sm onClick={()=>setPinPhase("set")}>{profiles[user].vaultPin?"Cambia PIN":"Imposta PIN"}</Btn>
            {profiles[user].vaultPin&&<Btn variant="ghost" sm style={{color:"var(--red)",borderColor:"var(--red)22"}} onClick={()=>setProfiles(p=>({...p,[user]:{...p[user],vaultPin:null}}))}>Rimuovi</Btn>}
          </div>
        )}
      </div>

      {/* THEME */}
      <SecLabel>Tema</SecLabel>
      <div style={{...S.card,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontSize:14,fontWeight:600}}>{isDark?"🌙 Modalità Scura":"☀️ Modalità Chiara"}</div><div style={{fontSize:12,color:"var(--dim)"}}>Cambia aspetto dell'app</div></div>
        <Toggle on={isDark} onToggle={()=>setIsDark(!isDark)}/>
      </div>

      {/* CUSTOM CATS */}
      <SecLabel>Categorie Personalizzate</SecLabel>
      <div style={{...S.card,marginBottom:12}}>
        {customCats.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingBottom:8,borderBottom:"1px solid var(--brd)"}}>
            <span style={{fontSize:18}}>{c.e}</span>
            <span style={{flex:1,fontSize:13}}>{c.label}</span>
            <div style={{width:12,height:12,borderRadius:"50%",background:c.color}}/>
            <Btn variant="ghost" sm style={{color:"var(--red)",borderColor:"var(--red)22",padding:"4px 8px"}} onClick={()=>setCustomCats(p=>p.filter(x=>x.id!==c.id))}>✕</Btn>
          </div>
        ))}
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:4}}>
          <Inp value={newE} onChange={e=>setNewE(e.target.value)} style={{width:56,textAlign:"center",fontSize:20,padding:"6px 8px"}} placeholder="🎯"/>
          <Inp value={newLabel} onChange={e=>setNewLabel(e.target.value)} style={{flex:1,minWidth:100}} placeholder="Nome categoria"/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {CAT_COLS.map(col=><div key={col} onClick={()=>setNewColor(col)} style={{width:20,height:20,borderRadius:"50%",background:col,cursor:"pointer",border:`2px solid ${newColor===col?"#fff":"transparent"}`}}/>)}
          </div>
          <Btn variant="gold" sm onClick={addCat}>+ Aggiungi</Btn>
        </div>
      </div>

      {/* CREDITS RESET */}
      <SecLabel>Crediti</SecLabel>
      <div style={S.card}>
        {resetConfirm?(
          <div>
            <div style={{fontSize:13,marginBottom:10}}>Reset crediti a 100 per entrambi?</div>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="red" sm onClick={()=>{setCredits({tomas:100,giulia:100});setResetConfirm(false);}}>Conferma Reset</Btn>
              <Btn variant="ghost" sm onClick={()=>setResetConfirm(false)}>Annulla</Btn>
            </div>
          </div>
        ):(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:14,fontWeight:600}}>Reset Crediti</div><div style={{fontSize:12,color:"var(--dim)"}}>Riporta entrambi a 100 ₡</div></div>
            <Btn variant="ghost" sm onClick={()=>setResetConfirm(true)}>Reset</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────
function CreateModal({user,profiles,maxC,cats,onCreate,onClose}){
  const [title,setTitle]=useState("");
  const [quota,setQuota]=useState(1.50);
  const [stakeStr,setStakeStr]=useState("10");
  const [cat,setCat]=useState(cats[0]?.id||"intimo");
  const [isSecret,setIsSecret]=useState(false);
  const [isCnt,setIsCnt]=useState(true);
  const [pegno,setPegno]=useState("");
  const [exp,setExp]=useState("");
  const stake=Math.max(0,parseFloat(stakeStr)||0);
  const prob=qToP(quota); const potWin=Math.round(stake*quota);
  const probC=prob>=70?"var(--grn)":prob>=40?"var(--gold)":"var(--red)";

  const submit=()=>{
    if(!title.trim()){alert("Inserisci una descrizione");return;}
    if(stake<=0||stake>maxC){alert(`Stake non valido (max ${Math.round(maxC)} ₡)`);return;}
    onCreate({title,quota,stake,category:cat,isSecret,isCounterable:!isSecret&&isCnt,pegno,expiresAt:exp?new Date(exp).getTime():null});
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}}>
      <div className="sUp" style={{background:"var(--surf)",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,padding:"24px 20px 36px",maxHeight:"92vh",overflowY:"auto",borderTop:"1px solid var(--brd)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700}}>Nuova Bet 🎲</div>
          <Btn variant="ghost" sm onClick={onClose}>✕</Btn>
        </div>

        {/* Secret toggle */}
        <div onClick={()=>{setIsSecret(!isSecret);if(!isSecret)setIsCnt(false);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:14,marginBottom:14,cursor:"pointer",background:isSecret?"var(--gold)14":"var(--card)",border:`1px solid ${isSecret?"var(--gold)":"var(--brd)"}`,transition:"all .2s"}}>
          <div><div style={{fontWeight:600,fontSize:14}}>{isSecret?"🔒 Bet Segreta (Vault)":"👁 Bet Condivisa"}</div><div style={{fontSize:12,color:"var(--dim)",marginTop:2}}>{isSecret?"Solo tu la vedi · Timestamp garantisce onestà":"Visibile a entrambi"}</div></div>
          <Toggle on={isSecret} onToggle={()=>{}}/>
        </div>

        {/* Counter toggle */}
        {!isSecret&&(
          <div onClick={()=>setIsCnt(!isCnt)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderRadius:12,marginBottom:14,cursor:"pointer",background:isCnt?"var(--blu)12":"var(--card)",border:`1px solid ${isCnt?"var(--blu)":"var(--brd)"}`,transition:"all .2s"}}>
            <div><div style={{fontWeight:600,fontSize:13}}>⚡ Abilita Sfida Diretta</div><div style={{fontSize:11,color:"var(--dim)",marginTop:1}}>{profiles[user==="tomas"?"giulia":"tomas"].name} può scommettere SÌ o NO</div></div>
            <Toggle on={isCnt} onToggle={()=>{}} color="var(--blu)"/>
          </div>
        )}

        {/* Title */}
        <div style={{marginBottom:16}}>
          <label style={S.lbl}>Scommessa</label>
          <Inp value={title} onChange={e=>setTitle(e.target.value)} placeholder={isSecret?"es. Stasera facciamo l'amore...":"es. Giulia arriverà in ritardo sabato"}/>
        </div>

        {/* Quota */}
        <div style={{marginBottom:16}}>
          <label style={S.lbl}>Quota & Probabilità</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {Q_PRE.map(p=>(
              <button key={p.q} onClick={()=>setQuota(p.q)} style={{...S.btn,padding:"6px 10px",fontSize:11,background:"transparent",border:`1px solid ${Math.abs(quota-p.q)<.06?"var(--gold)":"var(--brd)"}`,color:Math.abs(quota-p.q)<.06?"var(--gold)":"var(--dim)"}}>{p.l}</button>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:12,color:"var(--dim)"}}>Probabilità implicita</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:probC}}>{prob}%</div>
          </div>
          <input type="range" min="5" max="95" step="1" className="bc" value={clamp(prob,5,95)} onChange={e=>setQuota(pToQ(parseInt(e.target.value)))} style={{marginBottom:4,width:"100%",height:5,borderRadius:3,outline:"none",cursor:"pointer",accentColor:"var(--gold)"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--mut)",marginBottom:12}}><span>Impossibile</span><span>Certissimo</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"var(--dim)",flexShrink:0}}>Quota diretta:</span>
            <Inp type="number" step=".05" min="1.05" max="50" value={quota} onChange={e=>{const v=parseFloat(e.target.value);if(!isNaN(v)&&v>=1.05&&v<=50)setQuota(parseFloat(v.toFixed(2)));}} style={{width:90}}/>
            {!isSecret&&isCnt&&<span style={{fontSize:11,color:"var(--dim)"}}>NO: <span style={{color:"var(--red)",fontWeight:700}}>{fmtQ(qNo(quota))}×</span></span>}
          </div>
        </div>

        {/* Stake */}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <label style={{...S.lbl,marginBottom:0}}>Stake</label>
            <span style={{fontSize:11,color:"var(--dim)"}}>Max {Math.round(maxC)} ₡</span>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {[5,10,20,50].map(s=>(
              <button key={s} onClick={()=>s<=maxC&&setStakeStr(String(s))} style={{...S.btn,flex:1,padding:"7px 4px",fontSize:12,background:"transparent",border:`1px solid ${stake===s?"var(--gold)":"var(--brd)"}`,color:stake===s?"var(--gold)":"var(--dim)",opacity:s>maxC?.4:1}}>{s}</button>
            ))}
          </div>
          <Inp type="number" min="1" max={Math.floor(maxC)} step="1" value={stakeStr} onChange={e=>setStakeStr(e.target.value)} placeholder="Importo libero..."/>
          <div style={{...S.card,marginTop:10,padding:"10px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:11,color:"var(--dim)"}}>Rischi</div><div style={{fontSize:17,fontWeight:700,color:"var(--red)"}}>−{stake} ₡</div></div>
              <div style={{color:"var(--mut)"}}>→</div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"var(--dim)"}}>Netta</div><div style={{fontSize:17,fontWeight:700,color:"var(--grn)"}}>+{potWin-stake} ₡</div></div>
              <div style={{color:"var(--mut)"}}>→</div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"var(--dim)"}}>Totale</div><div style={{fontSize:17,fontWeight:700,color:"var(--gold)"}}>{potWin} ₡</div></div>
            </div>
          </div>
        </div>

        {/* Category */}
        <div style={{marginBottom:16}}>
          <label style={S.lbl}>Categoria</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {cats.map(c=>(
              <button key={c.id} onClick={()=>setCat(c.id)} style={{...S.btn,padding:"7px 12px",fontSize:12,background:"transparent",border:`1px solid ${cat===c.id?c.color:"var(--brd)"}`,color:cat===c.id?c.color:"var(--dim)"}}>{c.e} {c.label}</button>
            ))}
          </div>
        </div>

        {/* Pegno */}
        <div style={{marginBottom:14}}>
          <label style={S.lbl}>Pegno (opzionale)</label>
          <Inp value={pegno} onChange={e=>setPegno(e.target.value)} placeholder="es. Ti preparo la colazione · scelgo io il film..."/>
        </div>

        {/* Expiry */}
        <div style={{marginBottom:24}}>
          <label style={S.lbl}>Scadenza (opzionale)</label>
          <input type="datetime-local" value={exp} onChange={e=>setExp(e.target.value)} style={{...S.inp,colorScheme:"dark"}}/>
        </div>

        <Btn variant="gold" full onClick={submit}>{isSecret?"🔒 Sigilla nel Vault":"🎯 Crea Bet"}</Btn>
      </div>
    </div>
  );
}

// ─── COUNTER BET MODAL ────────────────────────────────────────────────────────
function CounterModal({bet,user,profiles,credits,cats,onPlace,onClose}){
  const [side,setSide]=useState(null);
  const [stakeStr,setStakeStr]=useState("10");
  const qY=bet.quota; const qN=qNo(bet.quota);
  const stake=parseFloat(stakeStr)||0;
  const q=side==="yes"?qY:qN;
  const potWin=Math.round(stake*q);
  const maxC=Math.round(credits[user]);
  const cat=cats.find(c=>c.id===bet.category)||cats[cats.length-1];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
      <div className="bIn" style={{...S.card,width:"100%",maxWidth:380,padding:24}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:6}}>⚡ Sfida Diretta</div>
        <div style={{fontSize:13,color:"var(--dim)",fontStyle:"italic",marginBottom:4,lineHeight:1.4}}>"{bet.title}"</div>
        <div style={{fontSize:11,color:"var(--dim)",marginBottom:20}}>{cat.e} {cat.label} · di {profiles[bet.creator].name}</div>
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          {[{s:"yes",l:"SÌ succederà",q:qY,c:"var(--grn)"},{s:"no",l:"NO non succederà",q:qN,c:"var(--red)"}].map(o=>(
            <div key={o.s} onClick={()=>setSide(o.s)} style={{flex:1,padding:"14px 10px",borderRadius:14,border:`2px solid ${side===o.s?o.c:"var(--brd)"}`,cursor:"pointer",textAlign:"center",background:side===o.s?`${o.c}18`.replace("var(--grn)","#2ecc7f").replace("var(--red)","#e05555"):"var(--surf)",transition:"all .18s"}}>
              <div style={{fontSize:12,fontWeight:600,color:o.c,marginBottom:4}}>{o.l}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"var(--gold)"}}>{fmtQ(o.q)}×</div>
              <div style={{fontSize:10,color:"var(--dim)"}}>{qToP(o.q)}%</div>
            </div>
          ))}
        </div>
        {side&&(
          <div className="fIn">
            <div style={{fontSize:11,color:"var(--dim)",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Stake (max {maxC} ₡)</div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {[5,10,20,50].map(s=>(
                <button key={s} onClick={()=>s<=maxC&&setStakeStr(String(s))} style={{...S.btn,flex:1,padding:"7px 4px",fontSize:12,background:"transparent",border:`1px solid ${stake===s?"var(--gold)":"var(--brd)"}`,color:stake===s?"var(--gold)":"var(--dim)",opacity:s>maxC?.4:1}}>{s}</button>
              ))}
            </div>
            <Inp type="number" min="1" max={maxC} value={stakeStr} onChange={e=>setStakeStr(e.target.value)} placeholder="Importo libero..." style={{marginBottom:10}}/>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",background:"var(--surf)",borderRadius:10,marginBottom:16,border:"1px solid var(--brd)"}}>
              <div><div style={{fontSize:11,color:"var(--dim)"}}>Rischi</div><div style={{fontSize:16,fontWeight:700,color:"var(--red)"}}>−{stake} ₡</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:"var(--dim)"}}>Vincita pot.</div><div style={{fontSize:16,fontWeight:700,color:"var(--grn)"}}>+{potWin} ₡</div></div>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:10}}>
          <Btn variant="ghost" style={{flex:1}} onClick={onClose}>Annulla</Btn>
          <Btn variant="gold" style={{flex:2}} disabled={!side||stake<=0||stake>credits[user]} onClick={()=>onPlace(bet,{bettor:user,side,stake,quotaUsed:q,potentialWin:potWin})}>
            Scommetti {side==="yes"?"SÌ →":side==="no"?"NO →":""}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── REVEAL MODAL ─────────────────────────────────────────────────────────────
function RevealModal({bet,cats,onResolve,onClose}){
  const [flipped,setFlipped]=useState(false);
  const [done,setDone]=useState(false);
  const cat=cats.find(c=>c.id===bet.category)||cats[cats.length-1];
  const go=outcome=>{setDone(true);setTimeout(()=>onResolve(bet,outcome),200);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.94)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:100,padding:28}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"var(--gold)",marginBottom:6,textAlign:"center"}}>Rivelazione 🔓</div>
      <div style={{fontSize:12,color:"var(--dim)",marginBottom:36}}>Creata: {fmtD(bet.createdAt)}</div>
      <div style={{perspective:900,width:280,height:180,marginBottom:32}}>
        <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",transition:"transform .65s cubic-bezier(.34,1.2,.64,1)",transform:flipped?"rotateY(180deg)":"rotateY(0)"}}>
          <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",borderRadius:18,background:"linear-gradient(135deg,var(--card),var(--surf))",border:"2px solid var(--gold)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer"}} onClick={()=>setFlipped(true)}>
            <div style={{fontSize:48}}>🔒</div>
            <div style={{fontSize:14,color:"var(--gold)",fontWeight:600}}>Tocca per rivelare</div>
          </div>
          <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",transform:"rotateY(180deg)",borderRadius:18,padding:20,background:"linear-gradient(135deg,var(--surf),var(--card))",border:`2px solid ${cat.color}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8}}>
            <div style={{fontSize:24}}>{cat.e}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,textAlign:"center",lineHeight:1.3,color:"var(--txt)"}}>{bet.title}</div>
            <div style={{display:"flex",gap:8}}><Bdg bg="var(--gold)22" c="var(--gold)">{fmtQ(bet.quota)}×</Bdg><Bdg bg="var(--mut)44" c="var(--dim)">{qToP(bet.quota)}%</Bdg></div>
            <div style={{fontSize:11,color:"var(--dim)"}}>Stake {bet.stake} ₡ → Win {bet.potentialWin} ₡</div>
          </div>
        </div>
      </div>
      {flipped&&!done&&(
        <div className="bIn" style={{textAlign:"center",width:"100%",maxWidth:320}}>
          <div style={{fontSize:14,color:"var(--dim)",marginBottom:14}}>È successa?</div>
          <div style={{display:"flex",gap:12}}>
            <Btn variant="grn" style={{flex:1,padding:"13px 0",fontSize:15}} onClick={()=>go("won")}>✅ Sì! Ho vinto</Btn>
            <Btn variant="red" style={{flex:1,padding:"13px 0",fontSize:15}} onClick={()=>go("lost")}>❌ No, persa</Btn>
          </div>
        </div>
      )}
      {!flipped&&<Btn variant="ghost" sm style={{marginTop:8}} onClick={onClose}>Annulla</Btn>}
    </div>
  );
}

// ─── RESOLVE MODAL ────────────────────────────────────────────────────────────
function ResolveModal({bet,cats,profiles,onResolve,onOvertime,onClose}){
  const [done,setDone]=useState(false);
  const go=o=>{setDone(true);setTimeout(()=>onResolve(bet,o),200);};
  const cbs=bet.counterBets||[];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
      <div className="bIn" style={{...S.card,width:"100%",maxWidth:380,padding:24}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:6}}>Dichiara Esito</div>
        <div style={{fontSize:13,color:"var(--dim)",fontStyle:"italic",marginBottom:16,lineHeight:1.4}}>"{bet.title}"</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{l:"Quota",v:`${fmtQ(bet.quota)}×`,c:"var(--gold)"},{l:"Stake",v:`${bet.stake} ₡`,c:"var(--txt)"},{l:"Win",v:`${bet.potentialWin} ₡`,c:"var(--grn)"}].map(s=>(
            <div key={s.l} style={{...S.card,flex:1,textAlign:"center",padding:"8px 6px",border:"1px solid var(--brd)"}}>
              <div style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div>
              <div style={{fontSize:9,color:"var(--dim)",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        {cbs.length>0&&(
          <div style={{marginBottom:14,padding:"10px 12px",background:"var(--surf)",borderRadius:10,border:"1px solid var(--brd)"}}>
            <div style={{fontSize:10,color:"var(--dim)",marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>Posizioni in gioco</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              <Bdg bg="var(--grn)22" c="var(--grn)">{profiles[bet.creator].avatar} SÌ · {bet.stake} ₡</Bdg>
              {cbs.map(cb=><Bdg key={cb.bettor} bg={cb.side==="yes"?"var(--grn)22":"var(--red)22"} c={cb.side==="yes"?"var(--grn)":"var(--red)"}>{profiles[cb.bettor].avatar} {cb.side==="yes"?"SÌ":"NO"} · {cb.stake} ₡</Bdg>)}
            </div>
          </div>
        )}
        <Btn variant="grn" full style={{marginBottom:10}} disabled={done} onClick={()=>go("won")}>✅ SÌ — È successa! (+{bet.potentialWin-bet.stake} ₡)</Btn>
        <Btn variant="red" full style={{marginBottom:10}} disabled={done} onClick={()=>go("lost")}>❌ NO — Non è successa (−{bet.stake} ₡)</Btn>
        <button disabled={done} onClick={()=>onOvertime(bet)} style={{...S.btn,width:"100%",padding:"14px 0",fontSize:15,background:"transparent",border:"1px solid #f9731644",color:"#f97316",marginBottom:10}}>🎲 OVERTIME — Testa o Croce</button>
        <Btn variant="ghost" style={{width:"100%",fontSize:13}} onClick={onClose}>Annulla</Btn>
      </div>
    </div>
  );
}

// ─── OVERTIME MODAL ───────────────────────────────────────────────────────────
function OvertimeModal({bet,profiles,onResult,onClose}){
  const [phase,setPhase]=useState("ready");
  const [winner,setWinner]=useState(null);
  const flip=()=>{
    setPhase("flipping");
    setTimeout(()=>{
      const w=Math.random()<.5?bet.creator:(bet.creator==="tomas"?"giulia":"tomas");
      setWinner(w);setPhase("result");
    },1600);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
      <div className="bIn" style={{...S.card,width:"100%",maxWidth:360,padding:24,textAlign:"center"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:6}}>🎲 OVERTIME</div>
        <div style={{fontSize:13,color:"var(--dim)",fontStyle:"italic",marginBottom:4}}>"{bet.title}"</div>
        <div style={{fontSize:12,color:"var(--dim)",marginBottom:24}}>Decide il caso.</div>
        <div style={{fontSize:72,marginBottom:24,display:"inline-block"}} className={phase==="flipping"?"spinC":""}>🪙</div>
        {phase==="ready"&&<Btn variant="gold" style={{padding:"13px 36px",fontSize:15}} onClick={flip}>Lancia la moneta!</Btn>}
        {phase==="flipping"&&<div style={{fontSize:14,color:"var(--dim)"}}>La moneta gira...</div>}
        {phase==="result"&&winner&&(
          <div className="bIn">
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"var(--gold)",marginBottom:8}}>{profiles[winner].avatar} {profiles[winner].name} vince!</div>
            <div style={{fontSize:13,color:"var(--dim)",marginBottom:20}}>Il caso ha deciso 🤝</div>
            <div style={{display:"flex",gap:10}}>
              <Btn variant="grn" style={{flex:1}} onClick={()=>onResult(bet,winner===bet.creator?"won":"lost")}>Accetto ✓</Btn>
              <Btn variant="ghost" style={{flex:1}} onClick={onClose}>Chiudi</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PIN MODAL ────────────────────────────────────────────────────────────────
function PinModal({user,profiles,onSuccess,onClose}){
  const [pin,setPin]=useState("");
  const [err,setErr]=useState("");
  const check=()=>{
    if(pin===profiles[user].vaultPin){onSuccess();}
    else{setErr("PIN errato — riprova");setPin("");}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
      <div className="bIn" style={{...S.card,width:"100%",maxWidth:320,padding:28,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:12}}>🔒</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:6}}>PIN Vault</div>
        <div style={{fontSize:13,color:"var(--dim)",marginBottom:20}}>Inserisci il PIN a 4 cifre</div>
        {err&&<div style={{fontSize:13,color:"var(--red)",marginBottom:12}}>{err}</div>}
        <Inp type="text" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="● ● ● ●" style={{textAlign:"center",fontSize:24,letterSpacing:8,marginBottom:16}}/>
        <Btn variant="gold" full onClick={check} style={{marginBottom:10}}>Sblocca</Btn>
        <Btn variant="ghost" style={{width:"100%"}} onClick={onClose}>Annulla</Btn>
      </div>
    </div>
  );
}

// ─── WIN OVERLAY ──────────────────────────────────────────────────────────────
function WinOverlay({amount}){
  const COLS=["#c8973f","#2ecc7f","#5b8af0","#a07ef5","#f97316"];
  return(
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,pointerEvents:"none"}} className="fIn">
      <div style={{position:"relative",textAlign:"center"}}>
        {Array.from({length:16},(_,i)=>(
          <div key={i} className="confp" style={{left:`${8+i*5.5}%`,top:"50%",width:8+i%4*3,height:8+i%4*3,background:COLS[i%5],animationDelay:`${i*.07}s`}}/>
        ))}
        <div className="bIn" style={{fontFamily:"'Playfair Display',serif",fontSize:68,fontWeight:900,color:"var(--gold)"}}>🏆</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:"var(--grn)",marginTop:6}}>+{amount} ₡</div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App(){
  const [isDark,setIsDark]=useState(true);
  const C=isDark?DARK:LIGHT;

  const [profiles,setProfiles]=useState({
    tomas:{name:"Tomas",avatar:"🃏",colorKey:"blue",vaultPin:null},
    giulia:{name:"Giulia",avatar:"♥️",colorKey:"purple",vaultPin:null},
  });
  const [customCats,setCustomCats]=useState([]);
  const cats=[...DEF_CATS,...customCats];

  const [user,setUser]=useState(null);
  const [view,setView]=useState("dashboard");
  const [bets,setBets]=useState([]);
  const [credits,setCredits]=useState({tomas:100,giulia:100});
  const [notifSince,setNotifSince]=useState({tomas:0,giulia:0});
  const [lastSeen,setLastSeen]=useState({tomas:0,giulia:0});

  const [showCreate,setShowCreate]=useState(false);
  const [revealBet,setRevealBet]=useState(null);
  const [resolveBet,setResolveBet]=useState(null);
  const [counterTarget,setCounterTarget]=useState(null);
  const [overtimeBet,setOvertimeBet]=useState(null);
  const [showPin,setShowPin]=useState(false);
  const [vaultUnlocked,setVaultUnlocked]=useState(false);
  const [winAnim,setWinAnim]=useState(null);

  const login=u=>{
    const prev=lastSeen[u]||0;
    setNotifSince(p=>({...p,[u]:prev}));
    setLastSeen(p=>({...p,[u]:Date.now()}));
    setUser(u);setView("dashboard");setVaultUnlocked(false);
  };

  const createBet=data=>{
    const b={id:uid(),creator:user,title:data.title,quota:parseFloat(data.quota),stake:data.stake,
      potentialWin:Math.round(data.stake*parseFloat(data.quota)),category:data.category,
      isSecret:data.isSecret,isCounterable:data.isCounterable,pegno:data.pegno,
      counterBets:[],expiresAt:data.expiresAt,createdAt:Date.now(),status:"active",flamed:false};
    setBets(p=>[...p,b]);
    setCredits(p=>({...p,[user]:parseFloat((p[user]-data.stake).toFixed(2))}));
    setShowCreate(false);
  };

  const resolveBetFn=(bet,outcome)=>{
    setBets(p=>p.map(b=>{
      if(b.id!==bet.id)return b;
      const cbs=(b.counterBets||[]).map(cb=>({...cb,status:(outcome==="won"&&cb.side==="yes")||(outcome==="lost"&&cb.side==="no")?"won":"lost"}));
      return{...b,status:outcome,counterBets:cbs};
    }));
    if(outcome==="won"){
      setCredits(p=>({...p,[bet.creator]:parseFloat((p[bet.creator]+bet.potentialWin).toFixed(2))}));
      setWinAnim(bet.potentialWin);
      setTimeout(()=>setWinAnim(null),2400);
    }
    (bet.counterBets||[]).forEach(cb=>{
      const cbWon=(outcome==="won"&&cb.side==="yes")||(outcome==="lost"&&cb.side==="no");
      if(cbWon)setCredits(p=>({...p,[cb.bettor]:parseFloat((p[cb.bettor]+cb.potentialWin).toFixed(2))}));
    });
    setRevealBet(null);setResolveBet(null);setOvertimeBet(null);
  };

  const placeCounter=(bet,cb)=>{
    setBets(p=>p.map(b=>b.id!==bet.id?b:{...b,counterBets:[...(b.counterBets||[]),cb]}));
    setCredits(p=>({...p,[cb.bettor]:parseFloat((p[cb.bettor]-cb.stake).toFixed(2))}));
    setCounterTarget(null);
  };

  const flame=id=>setBets(p=>p.map(b=>b.id===id?{...b,flamed:!b.flamed}:b));

  const secretCount=bets.filter(b=>b.creator===user&&b.isSecret&&b.status==="active").length;

  // Root element with CSS vars set inline — always works in any sandbox
  const rootStyle={...rootVars(C),maxWidth:480,margin:"0 auto",paddingBottom:90,position:"relative"};

  if(!user){
    return(
      <div className="bc" style={rootVars(C)}>
        <style>{CSS_BASE}</style>
        <WelcomeScreen profiles={profiles} onSelect={login}/>
      </div>
    );
  }

  const NAV=[
    {id:"dashboard",e:"🏠",l:"Home"},
    {id:"bets",e:"🎯",l:"Bets"},
    {id:"vault",e:"🔒",l:"Vault"},
    {id:"stats",e:"📊",l:"Stats"},
    {id:"settings",e:"⚙️",l:"Config"},
  ];

  return(
    <div className="bc" style={rootStyle}>
      <style>{CSS_BASE}</style>

      {/* Header */}
      <div style={{padding:"18px 20px 4px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:C.bg,zIndex:10,borderBottom:`1px solid ${C.brd}22`}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Avatar profile={profiles[user]} size={38}/>
          <div>
            <div style={{fontSize:10,color:"var(--dim)",letterSpacing:2,textTransform:"uppercase"}}>Bentornato</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>{profiles[user].name}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:"var(--dim)"}}>Crediti</div>
            <div style={{fontSize:17,fontWeight:700,color:"var(--gold)"}}>{Math.round(credits[user])} ₡</div>
          </div>
          <Btn variant="ghost" sm style={{fontSize:11}} onClick={()=>{setUser(null);setVaultUnlocked(false);}}>Switch</Btn>
        </div>
      </div>

      {/* Content */}
      <div style={{padding:"14px 20px"}}>
        {view==="dashboard"&&<DashboardView user={user} profiles={profiles} credits={credits} bets={bets} cats={cats} onCreate={()=>setShowCreate(true)} onResolve={b=>setResolveBet(b)} onReveal={b=>setRevealBet(b)} onCounter={b=>setCounterTarget(b)} onFlame={flame} notifSince={notifSince}/>}
        {view==="bets"&&<BetsView user={user} profiles={profiles} bets={bets} cats={cats} onResolve={b=>setResolveBet(b)} onCounter={b=>setCounterTarget(b)} onFlame={flame}/>}
        {view==="vault"&&<VaultView user={user} profiles={profiles} bets={bets} cats={cats} onReveal={b=>setRevealBet(b)} onFlame={flame} unlocked={vaultUnlocked} onPinRequest={()=>setShowPin(true)}/>}
        {view==="stats"&&<StatsView user={user} profiles={profiles} credits={credits} bets={bets} cats={cats}/>}
        {view==="settings"&&<SettingsView user={user} profiles={profiles} setProfiles={setProfiles} isDark={isDark} setIsDark={setIsDark} customCats={customCats} setCustomCats={setCustomCats} credits={credits} setCredits={setCredits}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.surf,borderTop:`1px solid ${C.brd}`,padding:"8px 2px 10px",display:"flex",justifyContent:"space-around",alignItems:"center",zIndex:50}}>
        {NAV.map(n=>(
          <div key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 10px",cursor:"pointer",borderRadius:12,fontSize:10,color:view===n.id?"var(--gold)":"var(--mut)",transition:"all .18s",position:"relative",userSelect:"none"}}>
            <span style={{fontSize:20}}>{n.e}</span>
            {n.id==="vault"&&secretCount>0&&(
              <div style={{position:"absolute",top:2,right:6,width:14,height:14,borderRadius:"50%",background:"var(--gold)",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{secretCount}</div>
            )}
            {n.l}
          </div>
        ))}
        <div onClick={()=>setShowCreate(true)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",userSelect:"none"}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 4px 16px var(--glow)`,transition:"all .18s"}}>+</div>
          <span style={{fontSize:10,color:"var(--gold)"}}>Nuova</span>
        </div>
      </div>

      {/* Modals */}
      {showCreate&&<CreateModal user={user} profiles={profiles} maxC={credits[user]} cats={cats} onCreate={createBet} onClose={()=>setShowCreate(false)}/>}
      {revealBet&&<RevealModal bet={revealBet} cats={cats} onResolve={resolveBetFn} onClose={()=>setRevealBet(null)}/>}
      {resolveBet&&<ResolveModal bet={resolveBet} cats={cats} profiles={profiles} onResolve={resolveBetFn} onOvertime={b=>{setResolveBet(null);setOvertimeBet(b);}} onClose={()=>setResolveBet(null)}/>}
      {counterTarget&&<CounterModal bet={counterTarget} user={user} profiles={profiles} credits={credits} cats={cats} onPlace={placeCounter} onClose={()=>setCounterTarget(null)}/>}
      {overtimeBet&&<OvertimeModal bet={overtimeBet} profiles={profiles} onResult={resolveBetFn} onClose={()=>setOvertimeBet(null)}/>}
      {showPin&&<PinModal user={user} profiles={profiles} onSuccess={()=>{setVaultUnlocked(true);setShowPin(false);}} onClose={()=>setShowPin(false)}/>}
      {winAnim&&<WinOverlay amount={winAnim}/>}
    </div>
  );
}
