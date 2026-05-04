import React, { useState } from 'react';
import { Btn, Inp, Toggle, SecLabel, Avatar, AVATARS, COLORS, CAT_COLS, getC } from '../Atoms.jsx';

const S = {
  card: {background:"var(--card)",border:"1px solid var(--brd)",borderRadius:16,padding:16},
  inp: {background:"var(--inp)",border:"1px solid var(--brd)",color:"var(--txt)",borderRadius:10,padding:"10px 14px",fontFamily:"'Syne',sans-serif",fontSize:14,outline:"none",width:"100%"},
};

export default function SettingsView({user,profiles,isDark,setIsDark,customCats,credits,onUpdateProfile,onResetCredits,onCreateCategory,onDeleteCategory,vaultPin,onSetVaultPin,isDesktop}){
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
    onCreateCategory({id:`c${Date.now()}`,emoji:newE,label:newLabel.trim(),color:newColor});
    setNewLabel("");
  };
  const savePin=()=>{
    if(pin1.length<4){setPinErr("Il PIN deve essere 4 cifre");return;}
    if(pin1!==pin2){setPinErr("I PIN non coincidono");return;}
    onSetVaultPin(pin1);
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
                <Inp value={p.name} disabled={!isMe} onChange={e=>onUpdateProfile(k,{...profiles[k],name:e.target.value.slice(0,16)})} style={{fontWeight:600}}/>
              </div>
            </div>
            {isMe&&<>
              <div style={{fontSize:11,color:"var(--dim)",marginBottom:8}}>Avatar</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {AVATARS.map(a=>(
                  <div key={a} onClick={()=>onUpdateProfile(k,{...profiles[k],avatar:a})} style={{width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer",background:p.avatar===a?"var(--gold)22":"var(--surf)",border:`1px solid ${p.avatar===a?"var(--gold)":"var(--brd)"}`}}>{a}</div>
                ))}
              </div>
              <div style={{fontSize:11,color:"var(--dim)",marginBottom:8}}>Colore tema</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(COLORS).map(([k2,hex])=>(
                  <div key={k2} onClick={()=>onUpdateProfile(k,{...profiles[k],colorKey:k2})} style={{width:26,height:26,borderRadius:"50%",background:hex,cursor:"pointer",border:`3px solid ${p.colorKey===k2?"#fff":"transparent"}`,boxShadow:p.colorKey===k2?`0 0 8px ${hex}`:"none"}}/>
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
            <div style={{fontSize:14,fontWeight:600}}>{vaultPin?"🔒 PIN attivo":"🔓 Nessun PIN"}</div>
            <div style={{fontSize:12,color:"var(--dim)",marginTop:2}}>Il vault è {vaultPin?"protetto":"accessibile"}</div>
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
            <Btn variant="ghost" sm onClick={()=>setPinPhase("set")}>{vaultPin?"Cambia PIN":"Imposta PIN"}</Btn>
            {vaultPin&&<Btn variant="ghost" sm style={{color:"var(--red)",borderColor:"var(--red)22"}} onClick={()=>onSetVaultPin(null)}>Rimuovi</Btn>}
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
            <span style={{fontSize:18}}>{c.e||c.emoji}</span>
            <span style={{flex:1,fontSize:13}}>{c.label}</span>
            <div style={{width:12,height:12,borderRadius:"50%",background:c.color}}/>
            <Btn variant="ghost" sm style={{color:"var(--red)",borderColor:"var(--red)22",padding:"4px 8px"}} onClick={()=>onDeleteCategory(c.id)}>✕</Btn>
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
              <Btn variant="red" sm onClick={()=>{onResetCredits({tomas:100,giulia:100});setResetConfirm(false);}}>Conferma Reset</Btn>
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
