import React from 'react';
import { SecLabel, Avatar, COLORS, getC } from '../Atoms.jsx';
import { useLang } from '../../i18n.js';
import BetCard from '../BetCard.jsx';

export default function BetsView({user,profiles,bets,cats,onResolve,onCounter,onFlame,isDesktop,reactions,onReaction}){
  const { t } = useLang();
  const other=user==="tomas"?"giulia":"tomas";
  const mine=bets.filter(b=>b.creator===user&&!b.isSecret&&b.status==="active");
  const theirs=bets.filter(b=>b.creator===other&&!b.isSecret&&b.status==="active");
  const total=mine.length+theirs.length;
  return(
    <div className="sUp">
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,marginBottom:4}}>{t('bets_view.title')}</div>
      <div style={{fontSize:13,color:"var(--dim)",marginBottom:20}}>{total===1?t('bets_view.sub_one'):t('bets_view.sub_many',{n:total})}</div>
      {mine.length>0&&<><SecLabel>{t('bets_view.mine')}</SecLabel>{mine.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onResolve={onResolve} onFlame={onFlame} onCounter={onCounter} isDesktop={isDesktop} reactions={reactions} onReaction={onReaction}/>)}</>}
      {theirs.length>0&&<><SecLabel mt={14}>{t('bets_view.theirs',{name:profiles[other].name})}</SecLabel>{theirs.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={onCounter} isDesktop={isDesktop} reactions={reactions} onReaction={onReaction}/>)}</>}
      {total===0&&(
        <div style={{textAlign:"center",padding:"52px 0",color:"var(--dim)"}}>
          <div style={{fontSize:48,marginBottom:12}}>🎯</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:17}}>{t('bets_view.empty')}</div>
        </div>
      )}
    </div>
  );
}
