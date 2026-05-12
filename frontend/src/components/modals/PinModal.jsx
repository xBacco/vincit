import React, { useState } from 'react';
import { Btn } from '../Atoms.jsx';
import { useLang } from '../../i18n.js';

const S = {
  card: {background:"var(--card)",border:"1px solid var(--brd)",borderRadius:16,padding:16},
  inp: {background:"var(--inp)",border:"1px solid var(--brd)",color:"var(--txt)",borderRadius:10,padding:"10px 14px",fontFamily:"'Manrope',sans-serif",fontSize:14,outline:"none",width:"100%"},
};

const Inp=({style={},value,onChange,placeholder,type="text"})=>(
  <input type={type} style={{...S.inp,...style}} value={value} onChange={onChange} placeholder={placeholder}/>
);

export default function PinModal({user,profiles,vaultPin,onSuccess,onClose}){
  const { t } = useLang();
  const [pin,setPin]=useState("");
  const [err,setErr]=useState("");
  const check=()=>{
    if(pin===vaultPin){onSuccess();}
    else{setErr(t('pin_modal.err_wrong'));setPin("");}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
      <div className="bIn" style={{...S.card,width:"100%",maxWidth:320,padding:28,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:12}}>🔒</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,marginBottom:6}}>{t('pin_modal.title')}</div>
        <div style={{fontSize:13,color:"var(--dim)",marginBottom:20}}>{t('pin_modal.subtitle')}</div>
        {err&&<div style={{fontSize:13,color:"var(--red)",marginBottom:12}}>{err}</div>}
        <Inp type="text" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder={t('pin_modal.placeholder')} style={{textAlign:"center",fontSize:24,letterSpacing:8,marginBottom:16}}/>
        <Btn variant="gold" full onClick={check} style={{marginBottom:10}}>{t('pin_modal.unlock')}</Btn>
        <Btn variant="ghost" style={{width:"100%"}} onClick={onClose}>{t('pin_modal.cancel')}</Btn>
      </div>
    </div>
  );
}
