import React, { useEffect, useRef, useState } from 'react';

// Ice easter egg — fires when the user triple-taps the ❄️ in the loss-streak
// pill. Three things happen in parallel:
//  1. A giant snowflake at the center spins and pulses (the egg's hero).
//  2. ~80 snowflakes fall on a canvas with random drift / size / opacity.
//  3. A frost overlay grows from each edge of the screen toward the middle
//     so the world literally "freezes" while the snow falls.
// Total runtime ~3s; tap-to-skip honored. Renders via createPortal in App.jsx.

const CSS = `
@keyframes bcIceBgIn   { from { opacity: 0 } to { opacity: 1 } }
@keyframes bcIceBgOut  { to   { opacity: 0 } }
@keyframes bcSnowflakeIn {
  0%   { transform: translate(-50%,-50%) scale(.2) rotate(0deg);    opacity: 0; filter: drop-shadow(0 0 0 #aef); }
  35%  { transform: translate(-50%,-50%) scale(1.1) rotate(540deg); opacity: 1; filter: drop-shadow(0 0 30px #aef); }
  100% { transform: translate(-50%,-50%) scale(1) rotate(1440deg);  opacity: 1; filter: drop-shadow(0 0 18px #cef); }
}
@keyframes bcSnowflakeExit {
  to { transform: translate(-50%,-50%) scale(2.2) rotate(2160deg); opacity: 0; filter: drop-shadow(0 0 0 #aef); }
}
@keyframes bcFrostTop    { from { transform: translateY(-100%) } to { transform: translateY(0) } }
@keyframes bcFrostBottom { from { transform: translateY( 100%) } to { transform: translateY(0) } }
@keyframes bcFrostLeft   { from { transform: translateX(-100%) } to { transform: translateX(0) } }
@keyframes bcFrostRight  { from { transform: translateX( 100%) } to { transform: translateX(0) } }
`;

export default function IceEggOverlay({ open, onClose }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const flakesRef = useRef([]);
  const [phase, setPhase] = useState(0); // 0 = entering, 1 = settled, 2 = exiting

  // Phase scheduler
  useEffect(() => {
    if (!open) return;
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 700);  // snowflake settled
    const t2 = setTimeout(() => setPhase(2), 2400); // exit triggers
    const t3 = setTimeout(() => onClose?.(),  3000); // unmount
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [open, onClose]);

  // Canvas snowfall — initialized when the overlay opens, cancelled on close.
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

    // Build flakes — 70 across the viewport with varied speed/size/drift
    const flakes = [];
    for (let i = 0; i < 70; i++) {
      flakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height, // start above screen
        r: (1 + Math.random() * 3) * dpr,
        vy: (0.6 + Math.random() * 1.4) * dpr,
        vx: (Math.random() - 0.5) * 0.4 * dpr,
        a: 0.55 + Math.random() * 0.4,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.03,
      });
    }
    flakesRef.current = flakes;

    const ctx = canvas.getContext('2d');
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const f of flakes) {
        f.y += f.vy;
        f.x += f.vx + Math.sin(f.y * 0.005) * 0.3 * dpr;
        f.rot += f.vrot;
        if (f.y - f.r > canvas.height) {
          f.y = -f.r * 2;
          f.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.globalAlpha = f.a;
        ctx.fillStyle = '#e6f3ff';
        ctx.beginPath();
        ctx.arc(0, 0, f.r, 0, Math.PI * 2);
        ctx.fill();
        // tiny cross-spike to suggest a flake instead of a dot
        ctx.strokeStyle = 'rgba(255,255,255,.55)';
        ctx.lineWidth = Math.max(1, f.r * 0.3);
        ctx.beginPath();
        ctx.moveTo(-f.r * 2.4, 0); ctx.lineTo(f.r * 2.4, 0);
        ctx.moveTo(0, -f.r * 2.4); ctx.lineTo(0, f.r * 2.4);
        ctx.stroke();
        ctx.restore();
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

  // Frost gradient — semi-transparent so the screen visibly freezes without
  // hiding the dashboard.
  const frostGrad = 'linear-gradient(180deg, rgba(220,236,255,.55) 0%, rgba(180,210,250,.18) 60%, rgba(160,200,250,0) 100%)';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9700,
        background: 'radial-gradient(circle at 50% 45%, rgba(140,180,235,.25) 0%, rgba(40,55,90,.55) 80%)',
        animation: fading
          ? 'bcIceBgOut .6s ease forwards'
          : 'bcIceBgIn .35s ease forwards',
        cursor: 'pointer', userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <style>{CSS}</style>

      {/* Canvas snowfall — fills the whole viewport behind the giant flake */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
      }}/>

      {/* Frost overlays sliding in from each edge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '38%',
        background: frostGrad,
        animation: 'bcFrostTop .9s cubic-bezier(.4,1.2,.5,1) both',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%',
        background: frostGrad,
        transform: 'scaleY(-1)',
        animation: 'bcFrostBottom .9s cubic-bezier(.4,1.2,.5,1) .1s both',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '22%',
        background: 'linear-gradient(90deg, rgba(220,236,255,.45) 0%, rgba(180,210,250,0) 100%)',
        animation: 'bcFrostLeft 1.1s cubic-bezier(.4,1.2,.5,1) .15s both',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: '22%',
        background: 'linear-gradient(270deg, rgba(220,236,255,.45) 0%, rgba(180,210,250,0) 100%)',
        animation: 'bcFrostRight 1.1s cubic-bezier(.4,1.2,.5,1) .15s both',
        pointerEvents: 'none',
      }}/>

      {/* The giant snowflake — center stage */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        fontSize: 200, lineHeight: 1,
        animation: fading
          ? 'bcSnowflakeExit .6s ease-in forwards'
          : 'bcSnowflakeIn 1s cubic-bezier(.2,1.4,.3,1) forwards',
        pointerEvents: 'none',
      }}>
        ❄️
      </div>

      {/* Skip hint */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase',
        color: 'rgba(230,243,255,.65)', fontFamily: "'Manrope', sans-serif",
        fontWeight: 600,
      }}>tap per chiudere</div>
    </div>
  );
}
