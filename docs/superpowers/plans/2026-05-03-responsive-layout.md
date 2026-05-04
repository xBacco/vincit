# BetCouple Responsive Desktop Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive desktop layout (≥768 px fixed sidebar + two-column content grid) without touching any mobile behaviour, business logic, or backend code.

**Architecture:** A `useBreakpoint(768)` hook in `App.jsx` drives all branching. `isDesktop` flows down as a prop. All layout stays in inline-style JSX — no new CSS classes.

**Tech Stack:** React 18, Vite 5, inline-style JSX. No test framework in repo — verification is manual via browser DevTools responsive mode.

---

## File Map

| File | Action |
|---|---|
| `frontend/index.html` | Add `<link rel="manifest">` |
| `frontend/public/manifest.json` | Create (new) |
| `frontend/public/icons/icon-192.png` | Create placeholder 1×1 PNG (new) |
| `frontend/public/icons/icon-512.png` | Create placeholder 1×1 PNG (new) |
| `frontend/src/App.jsx` | Add `useBreakpoint`, add `useEffect` import, `isDesktop`, sidebar, conditional header/bottom-nav, pass `isDesktop` to all views |
| `frontend/src/components/BetCard.jsx` | Add `isDesktop` prop: quota inline in badges row on desktop, actions right-aligned |
| `frontend/src/components/views/DashboardView.jsx` | Add `isDesktop` prop: two-column grid on desktop |
| `frontend/src/components/views/BetsView.jsx` | Add `isDesktop` prop: pass through to `BetCard` |
| `frontend/src/components/views/VaultView.jsx` | Add `isDesktop` prop: pass through to `BetCard` (resolved bets) |
| `frontend/src/components/views/StatsView.jsx` | Add `isDesktop` prop: 4-column stat grid on desktop |
| `frontend/src/components/views/SettingsView.jsx` | Add `isDesktop` to prop signature (no layout changes) |

---

## Task 1: PWA Manifest and Icons

**Files:**
- Create: `frontend/public/manifest.json`
- Create: `frontend/public/icons/icon-192.png`
- Create: `frontend/public/icons/icon-512.png`
- Modify: `frontend/index.html`

- [ ] **Step 1: Create `public/` directory and placeholder icons**

Run from the repo root:
```bash
python3 -c "
import os, struct, zlib

def make_png(w, h):
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    raw = b'\x00' + b'\x00\x00\x00' * w
    idat = chunk(b'IDAT', zlib.compress(raw * h))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

os.makedirs('frontend/public/icons', exist_ok=True)
png = make_png(1, 1)
open('frontend/public/icons/icon-192.png', 'wb').write(png)
open('frontend/public/icons/icon-512.png', 'wb').write(png)
print('Icons created')
"
```

Expected output: `Icons created`

- [ ] **Step 2: Create `frontend/public/manifest.json`**

Create the file with this exact content:
```json
{
  "name": "BetCouple",
  "short_name": "BetCouple",
  "display": "standalone",
  "background_color": "#07060f",
  "theme_color": "#c8973f",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Add manifest link to `frontend/index.html`**

Add one line inside `<head>`, after the existing `<link>` tags:
```html
<link rel="manifest" href="/manifest.json">
```

Full resulting `<head>` section:
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BetCouple</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
  <link rel="manifest" href="/manifest.json">
  <style>* { box-sizing: border-box; margin: 0; padding: 0; }</style>
</head>
```

- [ ] **Step 4: Verify manifest loads in browser**

Start dev server (`npm run dev` in `frontend/`), open `http://localhost:5173` in Chrome, open DevTools → Application → Manifest. Confirm "BetCouple" appears with theme color `#c8973f`. No errors in the manifest panel.

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/public/
git commit -m "feat: add PWA manifest with placeholder icons"
```

---

## Task 2: Add `useBreakpoint` hook to App.jsx

**Files:**
- Modify: `frontend/src/App.jsx` (import line + new function + one const inside App)

- [ ] **Step 1: Add `useEffect` to the React import**

Change line 1 of `frontend/src/App.jsx` from:
```js
import React, { useState, useCallback } from 'react';
```
to:
```js
import React, { useState, useCallback, useEffect } from 'react';
```

- [ ] **Step 2: Add the `useBreakpoint` function**

Insert the following function directly before the `export default function App()` line (after the `lsDel` / vault helpers block, before App):
```js
function useBreakpoint(minWidth) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(`(min-width: ${minWidth}px)`).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handler = e => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [minWidth]);
  return matches;
}
```

- [ ] **Step 3: Add `isDesktop` inside App()**

Insert one line at the top of the App function body, right after `const C = isDark ? DARK : LIGHT;`:
```js
const isDesktop = useBreakpoint(768);
```

- [ ] **Step 4: Verify no runtime errors**

With dev server running, open the browser console. Resize the window past 768 px and back. No errors. The value can be verified by adding a temporary `console.log(isDesktop)` inside App and removing it after. Hot reload should work normally.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add useBreakpoint(768) hook to App"
```

---

## Task 3: App.jsx — Sidebar Layout (Desktop) and Conditional Mobile Layout

**Files:**
- Modify: `frontend/src/App.jsx` (the main `return(...)` block and `rootStyle`)

- [ ] **Step 1: Update `rootStyle` to be breakpoint-aware**

Find this line (currently line 159):
```js
const rootStyle = { ...rootVars(C), maxWidth: 480, margin: '0 auto', paddingBottom: 90, position: 'relative' };
```

Replace it with:
```js
const rootStyle = isDesktop
  ? { ...rootVars(C), minHeight: '100vh', position: 'relative' }
  : { ...rootVars(C), maxWidth: 480, margin: '0 auto', paddingBottom: 90, position: 'relative' };
```

- [ ] **Step 2: Replace the entire `return(...)` block**

Replace everything from `return (` to the closing `);` of the App component's return with the following. This wraps the existing header and bottom-nav in `{!isDesktop && ...}` guards and adds the desktop sidebar:

```jsx
  return (
    <div className="bc" style={rootStyle}>
      <style>{CSS_BASE}</style>

      {/* Sidebar: desktop only */}
      {isDesktop && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: 220, height: '100vh', background: 'var(--surf)', borderRight: '1px solid var(--brd)', display: 'flex', flexDirection: 'column', zIndex: 50, padding: '24px 0' }}>
          <div style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--brd)', marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${COLORS[profiles[user].colorKey] || '#5b8af0'}33`, border: `2px solid ${COLORS[profiles[user].colorKey] || '#5b8af0'}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 10 }}>{profiles[user].avatar}</div>
            <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: 2, textTransform: 'uppercase' }}>Bentornato</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{profiles[user].name}</div>
            <div style={{ fontSize: 10, color: 'var(--dim)' }}>Crediti</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>{Math.round(credits[user])} ₡</div>
            <button style={{ width: '100%', padding: '6px 0', borderRadius: 8, border: '1px solid var(--brd)', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 600, background: 'transparent', color: 'var(--dim)' }} onClick={() => { lsDel('bc_user'); setUser(null); setVaultUnlocked(false); }}>Switch</button>
          </div>
          <div style={{ flex: 1, padding: '4px 12px' }}>
            {NAV.map(n => (
              <div key={n.id} onClick={() => setView(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: view === n.id ? 'var(--gold)' : 'var(--dim)', background: view === n.id ? 'var(--gold)11' : 'transparent', marginBottom: 4, transition: 'all .18s', userSelect: 'none', position: 'relative' }}>
                <span style={{ fontSize: 18 }}>{n.e}</span>
                {n.l}
                {n.id === 'vault' && secretCount > 0 && (
                  <div style={{ position: 'absolute', right: 10, width: 16, height: 16, borderRadius: '50%', background: 'var(--gold)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{secretCount}</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px 0' }}>
            <button onClick={() => setShowCreate(true)} style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', background: 'var(--gold)', color: '#07060f', fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px var(--glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>+ Nuova Bet</button>
          </div>
        </div>
      )}

      {/* Header: mobile only */}
      {!isDesktop && (
        <div style={{ padding: '18px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: C.bg, zIndex: 10, borderBottom: `1px solid ${C.brd}22` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${COLORS[profiles[user].colorKey] || '#5b8af0'}33`, border: `2px solid ${COLORS[profiles[user].colorKey] || '#5b8af0'}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 * 0.42, flexShrink: 0 }}>{profiles[user].avatar}</div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: 2, textTransform: 'uppercase' }}>Bentornato</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>{profiles[user].name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--dim)' }}>Crediti</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{Math.round(credits[user])} ₡</div>
            </div>
            <button style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, border: '1px solid var(--brd)', cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 600, background: 'transparent', color: 'var(--dim)' }} onClick={() => { lsDel('bc_user'); setUser(null); setVaultUnlocked(false); }}>Switch</button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={isDesktop ? { marginLeft: 220, maxWidth: 900, padding: '32px 40px' } : { padding: '14px 20px' }}>
        {view === 'dashboard' && <DashboardView user={user} profiles={profiles} credits={credits} bets={bets} cats={cats} onCreate={() => setShowCreate(true)} onResolve={b => setResolveBet(b)} onReveal={b => setRevealBet(b)} onCounter={b => setCounterTarget(b)} onFlame={handleFlame} notifSince={notifSince} isDesktop={isDesktop} />}
        {view === 'bets'      && <BetsView user={user} profiles={profiles} bets={bets} cats={cats} onResolve={b => setResolveBet(b)} onCounter={b => setCounterTarget(b)} onFlame={handleFlame} isDesktop={isDesktop} />}
        {view === 'vault'     && <VaultView user={user} profiles={profiles} bets={bets} cats={cats} onReveal={b => setRevealBet(b)} onFlame={handleFlame} unlocked={vaultUnlocked} onPinRequest={() => setShowPin(true)} vaultPin={vaultPin} isDesktop={isDesktop} />}
        {view === 'stats'     && <StatsView user={user} profiles={profiles} credits={credits} bets={bets} cats={cats} isDesktop={isDesktop} />}
        {view === 'settings'  && <SettingsView user={user} profiles={profiles} isDark={isDark} setIsDark={setIsDark} customCats={customCats} credits={credits} onUpdateProfile={handleUpdateProfile} onResetCredits={handleResetCredits} onCreateCategory={handleCreateCategory} onDeleteCategory={handleDeleteCategory} vaultPin={vaultPin} onSetVaultPin={handleSetVaultPin} isDesktop={isDesktop} />}
      </div>

      {/* Bottom nav: mobile only */}
      {!isDesktop && (
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: C.surf, borderTop: `1px solid ${C.brd}`, padding: '8px 2px 10px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 50 }}>
          {NAV.map(n => (
            <div key={n.id} onClick={() => setView(n.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 10px', cursor: 'pointer', borderRadius: 12, fontSize: 10, color: view === n.id ? 'var(--gold)' : 'var(--mut)', transition: 'all .18s', position: 'relative', userSelect: 'none' }}>
              <span style={{ fontSize: 20 }}>{n.e}</span>
              {n.id === 'vault' && secretCount > 0 && (
                <div style={{ position: 'absolute', top: 2, right: 6, width: 14, height: 14, borderRadius: '50%', background: 'var(--gold)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{secretCount}</div>
              )}
              {n.l}
            </div>
          ))}
          <div onClick={() => setShowCreate(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `0 4px 16px var(--glow)`, transition: 'all .18s' }}>+</div>
            <span style={{ fontSize: 10, color: 'var(--gold)' }}>Nuova</span>
          </div>
        </div>
      )}

      {/* Modals — unchanged */}
      {showCreate     && <CreateModal user={user} profiles={profiles} maxC={credits[user]} cats={cats} onCreate={handleCreate} onClose={() => setShowCreate(false)} />}
      {revealBet      && <RevealModal bet={revealBet} cats={cats} onResolve={handleResolve} onClose={() => setRevealBet(null)} />}
      {resolveBet     && <ResolveModal bet={resolveBet} cats={cats} profiles={profiles} onResolve={handleResolve} onOvertime={b => { setResolveBet(null); setOvertimeBet(b); }} onClose={() => setResolveBet(null)} />}
      {counterTarget  && <CounterModal bet={counterTarget} user={user} profiles={profiles} credits={credits} cats={cats} onPlace={handleCounter} onClose={() => setCounterTarget(null)} />}
      {overtimeBet    && <OvertimeModal bet={overtimeBet} profiles={profiles} onResult={handleResolve} onClose={() => setOvertimeBet(null)} />}
      {showPin        && <PinModal user={user} profiles={profiles} vaultPin={vaultPin} onSuccess={() => { setVaultUnlocked(true); setShowPin(false); }} onClose={() => setShowPin(false)} />}
      {winAnim        && <WinOverlay amount={winAnim} onDone={() => setWinAnim(null)} />}
    </div>
  );
```

- [ ] **Step 3: Verify desktop layout in browser**

Resize to ≥768 px. Confirm:
- Sidebar appears on the left (220 px, gold "Nuova Bet" button at bottom)
- Nav links highlight on click
- Header and bottom nav are gone
- Content area has `margin-left: 220px`

Resize to <768 px. Confirm:
- Sidebar disappears
- Header reappears at top
- Bottom nav reappears at bottom
- Layout is pixel-identical to before

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add desktop sidebar layout, hide mobile header/bottom-nav on desktop"
```

---

## Task 4: BetCard — Desktop Inline Quota and Right-Aligned Actions

**Files:**
- Modify: `frontend/src/components/BetCard.jsx`

- [ ] **Step 1: Replace the full file content**

Replace `frontend/src/components/BetCard.jsx` entirely with:

```jsx
import React from 'react';
import { Btn, Bdg, Avatar, fmtQ, fmtD, tLeft, isSoon, qNo, COLORS } from './Atoms.jsx';

const S = {
  card: {background:"var(--card)",border:"1px solid var(--brd)",borderRadius:16,padding:16},
  btn: {display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 18px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:600,transition:"all .18s",userSelect:"none",whiteSpace:"nowrap"},
  row: {display:"flex",alignItems:"center",gap:10},
};

const getC = (profiles,user)=>COLORS[profiles[user].colorKey]||"#5b8af0";
const qToP = q=>Math.round(100/parseFloat(q));

export default function BetCard({bet,user,profiles,cats,onResolve,onReveal,onCounter,onFlame,isDesktop}){
  const other=user==="tomas"?"giulia":"tomas";
  const isOwner=bet.creator===user;
  const cat=cats.find(c=>c.id===bet.category)||cats[cats.length-1];
  const done=["won","lost"].includes(bet.status);
  const tl=tLeft(bet.expiresAt);
  const myCounter=(bet.counterBets||[]).find(cb=>cb.bettor===user);
  const theirCounter=(bet.counterBets||[]).find(cb=>cb.bettor!==user);
  const sideColor=done?(bet.status==="won"?"var(--grn)":"var(--red)"):(bet.isSecret?"var(--gold)":cat.color);

  const actions=isOwner&&!done&&(
    <div style={{display:"flex",gap:8,...(isDesktop?{flexDirection:"column",alignItems:"stretch",flexShrink:0,justifyContent:"center"}:{})}}>
      {bet.isSecret
        ?<Btn variant="gold" sm style={isDesktop?{}:{flex:1}} onClick={()=>onReveal(bet)}>🔓 Rivela</Btn>
        :<Btn variant="grn" sm style={isDesktop?{}:{flex:1}} onClick={()=>onResolve(bet)}>Dichiara esito</Btn>
      }
      <button onClick={()=>onFlame(bet.id)} style={{...S.btn,padding:"7px 10px",background:"transparent",border:"1px solid var(--brd)",color:bet.flamed?"#f97316":"var(--dim)",fontSize:12}}>{bet.flamed?"🔥":"🤍"}</button>
    </div>
  );

  return(
    <div className="sUp" style={{...S.card,marginBottom:10,position:"relative",overflow:"hidden",opacity:done?0.78:1,border:`1px solid ${bet.isSecret?"var(--gold)44":"var(--brd)"}`}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:sideColor,borderRadius:"3px 0 0 3px"}}/>
      <div style={{paddingLeft:12,...(isDesktop?{display:"flex",alignItems:"flex-start",gap:16}:{})}}>
        {/* Main content */}
        <div style={{flex:isDesktop?1:undefined,minWidth:0}}>
          {/* Title row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
            <div style={{flex:1}}>
              {bet.isSecret&&!done
                ?<div style={{...S.row,gap:6}}><span>🔒</span><span style={{fontWeight:600,fontSize:14,color:"var(--gold)"}}>Bet Segreta</span></div>
                :<div style={{fontWeight:600,fontSize:14,lineHeight:1.35}}>{bet.title}</div>
              }
              <div style={{fontSize:11,color:"var(--dim)",marginTop:3}}>
                {cat.e} {cat.label} · {fmtD(bet.createdAt)}
                {!isOwner&&<span style={{color:getC(profiles,bet.creator)}}> · {profiles[bet.creator].name}</span>}
              </div>
            </div>
            {/* Quota top-right: mobile only */}
            {!isDesktop&&!bet.isSecret&&<div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"var(--gold)"}}>{fmtQ(bet.quota)}×</div>
              <div style={{fontSize:10,color:"var(--dim)"}}>{qToP(bet.quota)}%</div>
            </div>}
          </div>

          {/* Badges */}
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
            {isDesktop&&!bet.isSecret&&<Bdg bg="var(--gold)22" c="var(--gold)">{fmtQ(bet.quota)}× · {qToP(bet.quota)}%</Bdg>}
            {!bet.isSecret&&<><Bdg bg="var(--mut)44" c="var(--dim)">Stake {bet.stake} ₡</Bdg><Bdg bg="var(--grn)22" c="var(--grn)">Win {bet.potentialWin} ₡</Bdg></>}
            {bet.pegno&&<Bdg bg="var(--gold)22" c="var(--gold)">🎁 {bet.pegno}</Bdg>}
            {tl&&<Bdg bg={isSoon(bet.expiresAt)?"var(--red)22":"var(--mut)33"} c={isSoon(bet.expiresAt)?"var(--red)":"var(--dim)"}>⏱ {tl}</Bdg>}
            {done&&<Bdg bg={bet.status==="won"?"var(--grn)22":"var(--red)22"} c={bet.status==="won"?"var(--grn)":"var(--red)"}>{bet.status==="won"?`✅ +${bet.potentialWin-bet.stake} ₡`:`❌ −${bet.stake} ₡`}</Bdg>}
          </div>

          {/* Counter-bet section */}
          {!bet.isSecret&&!done&&bet.isCounterable&&(
            <div style={{borderTop:"1px solid var(--brd)",paddingTop:8,marginBottom:8}}>
              <div style={{fontSize:10,color:"var(--dim)",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Sfida diretta</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                <Bdg bg="var(--grn)22" c="var(--grn)">{profiles[bet.creator].avatar} SÌ @ {fmtQ(bet.quota)}×</Bdg>
                {theirCounter&&<Bdg bg={theirCounter.side==="yes"?"var(--grn)22":"var(--red)22"} c={theirCounter.side==="yes"?"var(--grn)":"var(--red)"}>{profiles[theirCounter.bettor].avatar} {theirCounter.side==="yes"?"SÌ":"NO"} @ {fmtQ(theirCounter.quotaUsed)}×</Bdg>}
              </div>
              {!isOwner&&!myCounter&&<Btn variant="ghost" sm full onClick={()=>onCounter(bet)}>⚡ Scommetti SÌ {fmtQ(bet.quota)}× o NO {fmtQ(qNo(bet.quota))}×</Btn>}
              {!isOwner&&myCounter&&<div style={{fontSize:12,color:"var(--dim)",fontStyle:"italic"}}>La tua posizione: {myCounter.side==="yes"?"✅ SÌ":"❌ NO"} @ {fmtQ(myCounter.quotaUsed)}× · {myCounter.stake} ₡</div>}
            </div>
          )}

          {/* Actions row: mobile only */}
          {!isDesktop&&actions}
        </div>

        {/* Actions column: desktop right side */}
        {isDesktop&&actions}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser at desktop width (≥768 px)**

Open the Dashboard or Bets view with at least one active bet. Confirm:
- Quota appears as a gold badge (`X.XX× · YY%`) in the badges row
- No quota block in the top-right corner of the card
- "Dichiara esito" button is vertically stacked on the right edge of the card (not below the badges)

Resize to <768 px. Confirm:
- Quota returns to top-right position
- Action button spans full width below badges
- Layout pixel-identical to before

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/BetCard.jsx
git commit -m "feat: BetCard desktop layout — inline quota badge, right-aligned actions"
```

---

## Task 5: DashboardView — Two-Column Desktop Grid

**Files:**
- Modify: `frontend/src/components/views/DashboardView.jsx`

- [ ] **Step 1: Replace the full file content**

Replace `frontend/src/components/views/DashboardView.jsx` entirely with:

```jsx
import React from 'react';
import { Btn, SecLabel, fmtD, isSoon, tLeft, COLORS, getC } from '../Atoms.jsx';
import BetCard from '../BetCard.jsx';

const S = {
  card: {background:"var(--card)",border:"1px solid var(--brd)",borderRadius:16,padding:16},
  row: {display:"flex",alignItems:"center",gap:10},
};

export default function DashboardView({user,profiles,credits,bets,cats,onCreate,onResolve,onReveal,onCounter,onFlame,notifSince,isDesktop}){
  const other=user==="tomas"?"giulia":"tomas";
  const myWon=bets.filter(b=>b.creator===user&&b.status==="won");
  const myLost=bets.filter(b=>b.creator===user&&b.status==="lost");
  const thWon=bets.filter(b=>b.creator===other&&b.status==="won");
  const myAct=bets.filter(b=>b.creator===user&&!b.isSecret&&b.status==="active");
  const mySec=bets.filter(b=>b.creator===user&&b.isSecret&&b.status==="active");
  const thAct=bets.filter(b=>b.creator===other&&!b.isSecret&&b.status==="active");
  const newPart=bets.filter(b=>b.creator===other&&!b.isSecret&&b.createdAt>(notifSince[user]||0)).length;
  const expiring=bets.filter(b=>b.creator===user&&b.status==="active"&&isSoon(b.expiresAt));
  const wr=(myWon.length+myLost.length)?Math.round(myWon.length/(myWon.length+myLost.length)*100):0;
  const meC=getC(profiles,user); const otC=getC(profiles,other);

  const scoreCard=(
    <div className="card pGold" style={{...S.card,marginBottom:14,background:"linear-gradient(135deg,var(--card),var(--surf))"}}>
      <SecLabel>Classifica</SecLabel>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {[{k:user,p:profiles[user],c:meC,w:myWon.length},{k:other,p:profiles[other],c:otC,w:thWon.length}].map((s,i)=>(
          <div key={s.k} style={{flex:1,textAlign:"center"}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:`${s.c}33`,border:`2px solid ${s.c}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto"}}>{s.p.avatar}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginTop:6}}>{s.p.name}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:i===0?"var(--gold)":s.c,lineHeight:1.1}}>{s.w}</div>
            <div style={{fontSize:10,color:"var(--dim)"}}>vittorie</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:12,paddingTop:12,borderTop:"1px solid var(--brd)"}}>
        {[{l:"Win Rate",v:`${wr}%`,c:wr>=50?"var(--grn)":"var(--red)"},{l:"Crediti",v:`${Math.round(credits[user])} ₡`,c:"var(--gold)"},{l:"Bet tot.",v:myWon.length+myLost.length+myAct.length+mySec.length,c:"var(--txt)"}].map(s=>(
          <div key={s.l} style={{textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:"var(--dim)"}}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const vaultTeaser=mySec.length>0&&(
    <div style={{...S.card,marginBottom:14,border:"1px solid var(--gold)44",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:36,height:36,borderRadius:"50%",background:"var(--gold)22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔒</div>
      <div>
        <div style={{fontWeight:600,fontSize:14,color:"var(--gold)"}}>Vault Segreto</div>
        <div style={{fontSize:12,color:"var(--dim)"}}>{mySec.length} bet privat{mySec.length===1?"a":"e"} — vai nel Vault per rivelare</div>
      </div>
    </div>
  );

  const expiryAlert=expiring.length>0&&(
    <div style={{...S.card,marginBottom:12,background:"var(--red)18",border:"1px solid var(--red)44"}}>
      <div style={{fontWeight:600,fontSize:13,color:"var(--red)",marginBottom:4}}>⏱ {expiring.length} bet in scadenza entro 24h!</div>
      {expiring.map(b=><div key={b.id} style={{fontSize:12,color:"var(--dim)",marginTop:2}}>· {b.title} — {tLeft(b.expiresAt)}</div>)}
    </div>
  );

  const activeBets=(myAct.length+thAct.length)>0&&(
    <>
      <SecLabel>Bets attive</SecLabel>
      {myAct.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onResolve={onResolve} onFlame={onFlame} onCounter={onCounter} isDesktop={isDesktop}/>)}
      {thAct.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={onCounter} isDesktop={isDesktop}/>)}
    </>
  );

  const emptyState=myAct.length+thAct.length+mySec.length===0&&(
    <div style={{textAlign:"center",padding:"52px 20px"}}>
      <div style={{fontSize:52,marginBottom:14}}>🎲</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:8}}>Nessuna bet attiva</div>
      <div style={{fontSize:13,color:"var(--dim)",marginBottom:24}}>Inizia a scommettere!</div>
      <Btn variant="gold" onClick={onCreate} style={{padding:"12px 28px",fontSize:15}}>+ Nuova Bet</Btn>
    </div>
  );

  const recentResolved=bets.filter(b=>b.creator===user&&["won","lost"].includes(b.status)).length>0&&(
    <>
      <SecLabel mt={16}>Ultime risolte</SecLabel>
      {bets.filter(b=>b.creator===user&&["won","lost"].includes(b.status)).slice(-3).reverse().map(b=>(
        <BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={onCounter} isDesktop={isDesktop}/>
      ))}
    </>
  );

  return(
    <div className="sUp">
      {/* Partner notification: full width in both layouts */}
      {newPart>0&&(
        <div style={{...S.card,marginBottom:12,background:`var(--gold)14`,border:"1px solid var(--gold)44",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>{profiles[other].avatar}</span>
          <div>
            <div style={{fontWeight:600,fontSize:13,color:"var(--gold)"}}>{profiles[other].name} ha creato {newPart} nuova{newPart>1?"e":""} bet!</div>
            <div style={{fontSize:11,color:"var(--dim)"}}>Guarda le Bets Condivise</div>
          </div>
        </div>
      )}

      {isDesktop?(
        <div style={{display:"grid",gridTemplateColumns:"60% 40%",gap:20,alignItems:"start"}}>
          <div>{activeBets}{emptyState}{recentResolved}</div>
          <div>{scoreCard}{vaultTeaser}{expiryAlert}</div>
        </div>
      ):(
        <>{expiryAlert}{scoreCard}{vaultTeaser}{activeBets}{emptyState}{recentResolved}</>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser at desktop width**

Open Dashboard (≥768 px). Confirm:
- Left column (wider) shows "Bets attive" list
- Right column (narrower) shows score card, then vault teaser, then expiry alerts if applicable
- Partner notification banner spans full width above the grid

Resize to <768 px. Confirm single-column order: expiry alert → score card → vault teaser → active bets → empty state → recent resolved.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/views/DashboardView.jsx
git commit -m "feat: DashboardView two-column grid on desktop"
```

---

## Task 6: BetsView and VaultView — Pass `isDesktop` Through to BetCard

**Files:**
- Modify: `frontend/src/components/views/BetsView.jsx`
- Modify: `frontend/src/components/views/VaultView.jsx`

- [ ] **Step 1: Update `BetsView.jsx`**

Change the function signature and all `<BetCard>` calls to include `isDesktop`:

```jsx
import React from 'react';
import { SecLabel, COLORS, getC } from '../Atoms.jsx';
import BetCard from '../BetCard.jsx';

export default function BetsView({user,profiles,bets,cats,onResolve,onCounter,onFlame,isDesktop}){
  const other=user==="tomas"?"giulia":"tomas";
  const mine=bets.filter(b=>b.creator===user&&!b.isSecret&&b.status==="active");
  const theirs=bets.filter(b=>b.creator===other&&!b.isSecret&&b.status==="active");
  return(
    <div className="sUp">
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,marginBottom:4}}>🎯 Bets Condivise</div>
      <div style={{fontSize:13,color:"var(--dim)",marginBottom:20}}>{mine.length+theirs.length} attive in questo momento</div>
      {mine.length>0&&<><SecLabel>Le mie</SecLabel>{mine.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onResolve={onResolve} onFlame={onFlame} onCounter={onCounter} isDesktop={isDesktop}/>)}</>}
      {theirs.length>0&&<><SecLabel mt={14}>Di {profiles[other].name}</SecLabel>{theirs.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={onCounter} isDesktop={isDesktop}/>)}</>}
      {mine.length+theirs.length===0&&(
        <div style={{textAlign:"center",padding:"52px 0",color:"var(--dim)"}}>
          <div style={{fontSize:48,marginBottom:12}}>🎯</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:17}}>Nessuna bet condivisa attiva</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `VaultView.jsx`**

Add `isDesktop` to the function signature and pass it to the `<BetCard>` call on the resolved bets (line 80 in the original). The active vault bets use a custom inline card and do not need `isDesktop`.

Change only these two things in `VaultView.jsx`:

1. Signature line — add `isDesktop`:
```jsx
export default function VaultView({user,profiles,bets,cats,onReveal,onFlame,unlocked,onPinRequest,vaultPin,isDesktop}){
```

2. The resolved BetCard call (currently `onCounter={()=>{}}`):
```jsx
{resolved.length>0&&<><SecLabel mt={16}>Risolte</SecLabel>{resolved.map(b=><BetCard key={b.id} bet={b} user={user} profiles={profiles} cats={cats} onFlame={onFlame} onCounter={()=>{}} isDesktop={isDesktop}/>)}</>}
```

- [ ] **Step 3: Verify in browser**

Open Bets view at ≥768 px. BetCards render with inline quota badge and right-aligned actions (same as Task 4 verification). No console errors.

Open Vault view, navigate to resolved bets. Same desktop layout on resolved BetCards.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/views/BetsView.jsx frontend/src/components/views/VaultView.jsx
git commit -m "feat: pass isDesktop to BetCard in BetsView and VaultView"
```

---

## Task 7: StatsView — 4-Column Grid on Desktop

**Files:**
- Modify: `frontend/src/components/views/StatsView.jsx`

- [ ] **Step 1: Add `isDesktop` to the function signature**

Change:
```jsx
export default function StatsView({user,profiles,credits,bets,cats}){
```
to:
```jsx
export default function StatsView({user,profiles,credits,bets,cats,isDesktop}){
```

- [ ] **Step 2: Update the stat boxes grid**

Find this line (currently ~line 30):
```jsx
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
```

Replace it with:
```jsx
<div style={{display:"grid",gridTemplateColumns:isDesktop?"1fr 1fr 1fr 1fr":"1fr 1fr",gap:10,marginBottom:12}}>
```

- [ ] **Step 3: Verify in browser**

Open Stats view at ≥768 px. The four stat boxes (✅ Vinte, ❌ Perse, 📈 Win Rate, 🔥 Streak max) appear in a single horizontal row.

Resize to <768 px. They return to the 2×2 grid.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/views/StatsView.jsx
git commit -m "feat: StatsView 4-column stat grid on desktop"
```

---

## Task 8: SettingsView — Accept `isDesktop` Prop (No Layout Changes)

**Files:**
- Modify: `frontend/src/components/views/SettingsView.jsx`

- [ ] **Step 1: Add `isDesktop` to the prop signature**

Open `SettingsView.jsx`, find the `export default function SettingsView({...})` line, and add `isDesktop` to the destructured props. No other changes.

The exact change depends on the current signature — add `,isDesktop` before the closing `}`.

- [ ] **Step 2: Verify no runtime errors**

Open Settings view at both <768 px and ≥768 px. No console errors. Layout unchanged at both breakpoints.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/views/SettingsView.jsx
git commit -m "feat: SettingsView accepts isDesktop prop"
```

---

## Final Verification Checklist

- [ ] At ≥768 px: sidebar visible, header + bottom nav hidden, content at `margin-left: 220px`
- [ ] At <768 px: sidebar hidden, header visible, bottom nav visible, `max-width: 480px` layout
- [ ] Dashboard ≥768 px: two-column (active bets left, score card + vault + expiry right)
- [ ] Dashboard <768 px: single column, order unchanged from original
- [ ] BetCard ≥768 px: quota badge inline, actions on right
- [ ] BetCard <768 px: quota top-right, actions full-width below badges
- [ ] Stats ≥768 px: four stat boxes in one row
- [ ] Stats <768 px: four stat boxes in 2×2 grid
- [ ] Manifest visible in Chrome DevTools → Application → Manifest
- [ ] No colors, fonts, animations, or UI copy changed
- [ ] No backend files modified
- [ ] `api.js` and `useSync.js` untouched
