import React, { useEffect } from 'react';

export default function WinOverlay({ amount, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

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
