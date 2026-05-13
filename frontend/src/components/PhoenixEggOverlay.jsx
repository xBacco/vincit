import React, { useEffect, useRef, useState } from 'react';

// Phoenix easter egg — fires when the user triple-taps the 🔥 in the
// win-streak pill. Sequence:
//  1. Small flame at center grows into a tall vertical fire pillar.
//  2. From the top of the flame a 🦅 emerges, rises across the screen,
//     leaves a warm trail of glow, and exits at the top.
//  3. Embers (canvas particles) drift upward through the whole scene
//     for the entire duration, sized small so it doesn't compete with
//     the bird.
// Total runtime ~3s; tap-to-skip honored.

const CSS = `
@keyframes bcPhxBgIn   { from { opacity: 0 } to { opacity: 1 } }
@keyframes bcPhxBgOut  { to   { opacity: 0 } }
@keyframes bcFlameGrow {
  0%   { transform: translate(-50%, 0) scale(.3, .3); opacity: 0 }
  20%  { transform: translate(-50%, 0) scale(1, 1);   opacity: 1 }
  60%  { transform: translate(-50%, 0) scale(1.6, 3.5); opacity: 1 }
  100% { transform: translate(-50%, 0) scale(1.4, 4.2); opacity: .9 }
}
@keyframes bcFlameFlicker {
  0%, 100% { filter: drop-shadow(0 -10px 40px rgba(255,140,40,.7)) }
  50%      { filter: drop-shadow(0 -16px 60px rgba(255,180,60,1))  }
}
@keyframes bcPhxRise {
  0%   { transform: translate(-50%, 0)       scale(.4) rotate(-8deg); opacity: 0 }
  20%  { transform: translate(-50%, -10vh)   scale(1)  rotate(0deg);  opacity: 1 }
  70%  { transform: translate(-50%, -55vh)   scale(1.1) rotate(4deg); opacity: 1 }
  100% { transform: translate(-50%, -90vh)   scale(.9) rotate(-2deg); opacity: 0 }
}
@keyframes bcPhxFade { to { opacity: 0 } }
`;

export default function PhoenixEggOverlay({ open, onClose }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const [phase, setPhase] = useState(0); // 0 = flame growing, 1 = bird rising, 2 = exiting

  useEffect(() => {
    if (!open) return;
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 700);   // bird emerges
    const t2 = setTimeout(() => setPhase(2), 2400);  // fade
    const t3 = setTimeout(() => onClose?.(), 3000);  // unmount
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [open, onClose]);

  // Canvas embers — small upward-floating particles
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    // Embers start clustered around the bottom-center (the flame base)
    const embers = [];
    const bottom = canvas.height * 0.85;
    const centerX = canvas.width / 2;
    for (let i = 0; i < 90; i++) {
      embers.push({
        x: centerX + (Math.random() - 0.5) * 200 * dpr,
        y: bottom + Math.random() * 100 * dpr,
        r: (1 + Math.random() * 2.5) * dpr,
        vy: -(1.2 + Math.random() * 2.5) * dpr,
        vx: (Math.random() - 0.5) * 0.6 * dpr,
        life: Math.random(),
        hue: 18 + Math.random() * 26, // 18..44 — deep orange → gold
      });
    }

    const ctx = canvas.getContext('2d');
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const e of embers) {
        e.y += e.vy;
        e.x += e.vx + Math.sin(e.y * 0.01) * 0.8 * dpr;
        e.life += 0.012;
        if (e.life > 1 || e.y < -20) {
          // respawn at the flame base
          e.y = bottom + Math.random() * 60 * dpr;
          e.x = centerX + (Math.random() - 0.5) * 200 * dpr;
          e.life = 0;
        }
        const alpha = Math.max(0, 1 - e.life) * 0.85;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${e.hue}, 95%, ${55 + e.life * 25}%)`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  if (!open) return null;
  const fading = phase === 2;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9700,
        background: 'radial-gradient(circle at 50% 80%, rgba(120,40,15,.55) 0%, rgba(20,8,3,.85) 80%)',
        animation: fading
          ? 'bcPhxBgOut .6s ease forwards'
          : 'bcPhxBgIn .35s ease forwards',
        cursor: 'pointer', userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{CSS}</style>

      {/* Embers canvas — sits behind the flame + bird */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
      }}/>

      {/* Fire pillar — anchored to bottom-center, scales upward */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%',
        fontSize: 120, lineHeight: 1,
        transformOrigin: 'bottom center',
        animation: 'bcFlameGrow .9s cubic-bezier(.3,.9,.4,1) forwards, bcFlameFlicker 1.4s ease-in-out 1s infinite',
        pointerEvents: 'none',
        opacity: fading ? 0 : 1,
        transition: 'opacity .6s ease',
      }}>
        🔥
      </div>

      {/* The phoenix — rises through the screen */}
      {phase >= 1 && (
        <div style={{
          position: 'absolute', bottom: '15vh', left: '50%',
          fontSize: 100, lineHeight: 1,
          animation: 'bcPhxRise 1.7s cubic-bezier(.4,.05,.3,1) forwards',
          filter: 'drop-shadow(0 0 22px rgba(255,170,80,.9))',
          pointerEvents: 'none',
        }}>
          🦅
        </div>
      )}

      {/* Skip hint */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase',
        color: 'rgba(255,210,160,.7)', fontFamily: "'Manrope', sans-serif",
        fontWeight: 600,
      }}>tap per chiudere</div>
    </div>
  );
}
