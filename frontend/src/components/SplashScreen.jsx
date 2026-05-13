import React, { useEffect, useState } from 'react';
import { useLang } from '../i18n.js';

// "Quick-flip" — concept A. A single gold coin drops in, spin-flips at
// breakneck speed for ~0.7s, flash-burst at peak, then the wordmark punches
// through from the coin's center and settles. All colors derive from the live
// theme tokens (`var(--bg)`, `var(--gold)`, `var(--card)`, …) so the splash
// matches whichever theme (Lavanda / Light / Amber) is active when it fires.
// Total runtime ≈ 1.6s; tap-to-skip honored throughout.
const CSS = `
@keyframes bcSplashBgIn  { from { opacity: 0 } to { opacity: 1 } }
@keyframes bcCoinDrop    { 0%   { transform: translateY(-44vh) scale(.4) rotateY(0deg); opacity: 0 }
                           45%  { transform: translateY(8px)   scale(1.08) rotateY(540deg); opacity: 1 }
                           65%  { transform: translateY(-4px)  scale(1)    rotateY(900deg); }
                           100% { transform: translateY(0)     scale(1.05) rotateY(1440deg); opacity: 1 } }
@keyframes bcCoinSpin    { 0%   { transform: scale(1.05) rotateY(0deg) }
                           100% { transform: scale(1.18) rotateY(2520deg) } }
@keyframes bcCoinSplit   { 0%   { transform: scale(1.18) rotateY(0deg);   opacity: 1; filter: brightness(1) }
                           40%  { transform: scale(1.6)  rotateY(180deg); opacity: 1; filter: brightness(1.8) }
                           100% { transform: scale(3.8)  rotateY(360deg); opacity: 0; filter: brightness(2.4) } }
@keyframes bcFlashBurst  { 0%   { transform: translate(-50%,-50%) scale(0);   opacity: 0 }
                           35%  { transform: translate(-50%,-50%) scale(1.2); opacity: 1 }
                           100% { transform: translate(-50%,-50%) scale(6);   opacity: 0 } }
@keyframes bcLogoIn      { 0%   { transform: translateY(18px) scale(.7); opacity: 0; filter: blur(6px) }
                           100% { transform: translateY(0)    scale(1);  opacity: 1; filter: blur(0) } }
@keyframes bcShimmer     { 0%   { background-position: -200% 0 }
                           100% { background-position:  200% 0 } }
@keyframes bcSubIn       { 0% { opacity: 0; letter-spacing: .55em }
                           100% { opacity: .75; letter-spacing: .35em } }
@keyframes bcSplashFade  { to { opacity: 0 } }
`;

export default function SplashScreen({ onDone, brand = 'BetCouple' }) {
  const { t } = useLang();
  // 0 = coin dropping, 1 = coin spinning fast, 2 = flash + split, 3 = logo, 4 = fade out
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 460);   // drop landed → start fast spin
    const t2 = setTimeout(() => setPhase(2), 820);   // flash + split
    const t3 = setTimeout(() => setPhase(3), 1020);  // logo punches through
    const t4 = setTimeout(() => setPhase(4), 1700);  // begin fade
    const t5 = setTimeout(() => onDone?.(), 2050);   // unmount
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onDone]);

  const skip = () => onDone?.();
  const letters = brand.split('');

  // Coin is a self-contained block so we can swap animations per phase cleanly.
  const coinAnim =
      phase === 0 ? 'bcCoinDrop .46s cubic-bezier(.32,1.6,.48,1) both'
    : phase === 1 ? 'bcCoinSpin .36s cubic-bezier(.45,.0,.55,1) both'
    : phase === 2 ? 'bcCoinSplit .22s ease-in forwards'
    :               'none';

  return (
    <div
      onClick={skip}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        // Theme-aware backdrop: bg → card radial keeps the splash on-palette
        // whether you're in DARK / LIGHT / AMBER.
        background: 'radial-gradient(circle at 50% 48%, var(--card) 0%, var(--bg) 70%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', userSelect: 'none',
        animation: phase >= 4 ? 'bcSplashFade .34s ease forwards' : 'bcSplashBgIn .2s ease both',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <style>{CSS}</style>

      {/* Stage area — fixed-height so the logo doesn't shift when the coin
          disappears. */}
      <div style={{
        position: 'relative',
        width: 220, height: 220,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
      }}>
        {/* Flash burst — radial white spike right when the coin splits. */}
        {phase === 2 && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--goldL) 0%, var(--gold)00 70%)',
            animation: 'bcFlashBurst .42s ease-out forwards',
            pointerEvents: 'none', mixBlendMode: 'screen',
          }}/>
        )}

        {/* The coin itself — a layered gold disc instead of an emoji so it
            scales crisply on retina + amber theme stays warm. */}
        {phase < 3 && (
          <div style={{
            position: 'relative',
            width: 110, height: 110, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, var(--goldL) 0%, var(--gold) 55%, color-mix(in srgb, var(--gold) 70%, #000) 100%)`,
            boxShadow: '0 14px 38px -10px var(--glow), 0 0 28px var(--glow), inset 0 -8px 14px rgba(0,0,0,.25), inset 0 4px 12px rgba(255,255,255,.25)',
            animation: coinAnim,
            transformStyle: 'preserve-3d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 56, fontStyle: 'italic', fontWeight: 700,
            color: 'color-mix(in srgb, var(--bg) 70%, #000)',
            textShadow: '0 1px 0 rgba(255,255,255,.35)',
            letterSpacing: '-0.02em',
            willChange: 'transform, opacity',
          }}>
            &amp;
          </div>
        )}

        {/* Logo — punches through where the coin was. */}
        {phase >= 3 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 52, fontWeight: 600, letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, var(--gold) 0%, var(--goldL) 50%, var(--gold) 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'bcShimmer 2.4s linear infinite',
          }}>
            {letters.map((ch, i) => (
              <span key={i} style={{
                display: 'inline-block',
                animation: `bcLogoIn .42s cubic-bezier(.34,1.56,.64,1) ${i * 42}ms both`,
              }}>{ch === ' ' ? ' ' : ch}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tagline — same Manrope + tracking as the rest of the UI */}
      {phase >= 3 && (
        <div style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 10, color: 'var(--dim)',
          letterSpacing: '.35em', textTransform: 'uppercase', fontWeight: 600,
          animation: 'bcSubIn .7s ease-out .25s both',
        }}>
          {t('splash.tagline')}
        </div>
      )}

      {/* Skip hint */}
      <div style={{
        position: 'absolute', bottom: 22, fontSize: 9,
        color: 'var(--mut)', letterSpacing: '.22em',
        fontFamily: "'Manrope', sans-serif",
        textTransform: 'uppercase', opacity: .7,
      }}>
        {t('splash.tap_skip')}
      </div>
    </div>
  );
}
