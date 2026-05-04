# BetCouple — Responsive Desktop + Mobile Layout

**Date:** 2026-05-03
**Scope:** Frontend only. Zero changes to backend, api.js, or useSync.js.

---

## Breakpoint Strategy

| Viewport | Behaviour |
|---|---|
| < 768px (mobile) | Current layout — pixel-identical, no changes |
| ≥ 768px (desktop) | New sidebar layout described below |

---

## Architecture & Layout (App.jsx)

### `useBreakpoint` hook
```js
// uses window.matchMedia('(min-width: 768px)'), updates on resize
const isDesktop = useBreakpoint(768);
```

### Desktop root
- Root `<div className="bc">` removes `maxWidth: 480` and `paddingBottom: 90`.
- Fixed left **sidebar** (220px wide) replaces both the sticky header and the bottom nav.
- Content area: `marginLeft: 220px`, `maxWidth: 900px`, `padding: 32px 40px`.

### Sidebar contents (top → bottom)
1. Avatar + name + credits (same data as current header)
2. "Switch" button (small, secondary style) — below credits
3. Nav links: Home · Bets · Vault · Stats · Config (with vault badge when secretCount > 0)
4. "Nuova" / New Bet button — pinned to sidebar bottom

### Mobile (unchanged)
- Sticky header with avatar / name / credits / Switch button remains.
- Fixed bottom nav with nav items + New Bet button remains.
- `rootStyle` keeps `maxWidth: 480`, `paddingBottom: 90`.

---

## Component Changes

### DashboardView — `isDesktop` prop

**Desktop:** two-column CSS grid (60% / 40%)
- Left column: active bets list (`myAct` + `thAct`)
- Right column: score card + vault teaser + expiry alerts (stacked)
- Partner notification banner: full-width above grid
- "Ultime risolte" section: full-width below grid

**Mobile:** unchanged single-column layout.

---

### BetCard — `isDesktop` prop

**Desktop:**
- Quota (`{fmtQ(bet.quota)}×`) moves from the top-right `<div>` into the badges row as a `<Bdg>` element alongside Stake / Win badges. The top-right quota block is hidden.
- The card body becomes a `flexDirection: row` layout: left side holds title + badges + counter section; right side holds the action buttons (`Dichiara esito` / `🔓 Rivela` + flame), vertically centered.

**Mobile:** unchanged.

---

### StatsView — `isDesktop` prop

**Desktop:** stat boxes grid → `gridTemplateColumns: "1fr 1fr 1fr 1fr"` (4 columns)

**Mobile:** unchanged `"1fr 1fr"` (2 columns).

---

### BetsView, VaultView, SettingsView — `isDesktop` prop passed but no layout changes

Single-column flow works well at wider widths; the extra padding from the content wrapper is sufficient.

---

## PWA Manifest

### New files
- `frontend/public/manifest.json`
- `frontend/public/icons/icon-192.png` (1×1 transparent PNG placeholder)
- `frontend/public/icons/icon-512.png` (1×1 transparent PNG placeholder)

### manifest.json
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

### index.html addition
```html
<link rel="manifest" href="/manifest.json">
```

No service worker. SSE sync must stay live — offline mode is explicitly excluded.

---

## Files Modified

| File | Change |
|---|---|
| `frontend/index.html` | Add manifest link |
| `frontend/src/App.jsx` | Add `useBreakpoint`, conditional sidebar vs bottom-nav layout |
| `frontend/src/components/views/DashboardView.jsx` | Accept `isDesktop`, two-column grid on desktop |
| `frontend/src/components/BetCard.jsx` | Accept `isDesktop`, inline quota + right-aligned actions on desktop |
| `frontend/src/components/views/StatsView.jsx` | Accept `isDesktop`, 4-column stat grid on desktop |

## Files NOT Modified

- `backend/*`
- `frontend/src/api.js`
- `frontend/src/useSync.js`
- All business logic, colors, fonts, animations, UI copy

---

## Constraints

- Mobile experience pixel-identical to current.
- No color, font, animation, or UI copy changes.
- No service worker.
- All layout via inline styles (consistent with existing codebase pattern — no CSS class-based layout added).
