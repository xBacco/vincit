import React from 'react';

// Tiny SVG sparkline. Works for any monotonic or non-monotonic series.
// points: number[] (values along time)
export default function Sparkline({
  points,
  width = 240,
  height = 56,
  color = 'var(--gold)',
  fill = true,
  showDot = true,
  baseline = null, // optional dashed reference line at a value
}) {
  if (!points || points.length < 2) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: 'var(--mut)' }}>
        — non abbastanza dati —
      </div>
    );
  }

  const min = Math.min(...points, baseline ?? Infinity);
  const max = Math.max(...points, baseline ?? -Infinity);
  const range = max - min || 1;
  const padY = 4;
  const innerH = height - padY * 2;
  const stepX = width / (points.length - 1);

  const project = v => height - padY - ((v - min) / range) * innerH;

  const norm = points.map((v, i) => ({ x: i * stepX, y: project(v) }));
  const path = norm.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;

  const last = norm[norm.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}>
      {fill && <path d={area} fill={color} opacity={0.16} />}
      {baseline != null && (
        <line
          x1={0} y1={project(baseline)} x2={width} y2={project(baseline)}
          stroke="var(--mut)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7}
        />
      )}
      <path d={path} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      {showDot && (
        <>
          <circle cx={last.x} cy={last.y} r={5} fill={color} opacity={0.25} />
          <circle cx={last.x} cy={last.y} r={3} fill={color} />
        </>
      )}
    </svg>
  );
}
