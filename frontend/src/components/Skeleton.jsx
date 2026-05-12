import React from 'react';

const CSS = `
@keyframes skelShine { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
.bc-skel{
  background:linear-gradient(90deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.12) 50%, rgba(255,255,255,.04) 100%);
  background-size:200% 100%;
  animation: skelShine 1.4s linear infinite;
  border-radius:6px;
}
`;

export function SkeletonCard({ withGoldStripe = false }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--brd)',
      borderRadius: 16, padding: 16, marginBottom: 10,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: withGoldStripe ? 'var(--gold)44' : 'var(--mut)',
      }}/>
      <div style={{ paddingLeft: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="bc-skel" style={{ height: 14, width: '60%' }}/>
          <div className="bc-skel" style={{ height: 22, width: 60, borderRadius: 10 }}/>
        </div>
        <div className="bc-skel" style={{ height: 10, width: '35%', marginBottom: 12 }}/>
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="bc-skel" style={{ height: 22, width: 70, borderRadius: 20 }}/>
          <div className="bc-skel" style={{ height: 22, width: 84, borderRadius: 20 }}/>
          <div className="bc-skel" style={{ height: 22, width: 50, borderRadius: 20 }}/>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, withGoldStripe = false }) {
  return (
    <div className="fIn">
      <style>{CSS}</style>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} withGoldStripe={withGoldStripe} />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="fIn">
      <style>{CSS}</style>
      {/* Score card placeholder */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--brd)',
        borderRadius: 16, padding: 16, marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div className="bc-skel" style={{ width: 44, height: 44, borderRadius: '50%' }}/>
        <div style={{ flex: 1 }}>
          <div className="bc-skel" style={{ height: 12, width: '40%', marginBottom: 8 }}/>
          <div className="bc-skel" style={{ height: 22, width: '25%' }}/>
        </div>
        <div className="bc-skel" style={{ width: 44, height: 44, borderRadius: '50%' }}/>
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
