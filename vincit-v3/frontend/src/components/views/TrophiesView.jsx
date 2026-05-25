import React from 'react';
import { useLang } from '../../i18n.js';
import TrophiesSection from '../TrophiesSection.jsx';

export default function TrophiesView({ bets = [], isDesktop }) {
  const { t } = useLang();
  return (
    <div className="sUp">
      <div style={{ marginBottom: 32, paddingTop: isDesktop ? 16 : 8 }}>
        <div className="bc-meta" style={{ marginBottom: 10 }}>— Collezione</div>
        <div className="bc-hero" style={{ fontSize: isDesktop ? 54 : 38 }}>
          {t('trophies.title')}
        </div>
      </div>
      <TrophiesSection embedded={false} betsTick={bets.length} />
    </div>
  );
}
