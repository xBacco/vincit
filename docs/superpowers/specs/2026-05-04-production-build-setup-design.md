# Production Build Setup — Design

**Date:** 2026-05-04

## Goal

Serve the entire BetCouple app from a single Express process, eliminating Vite's file watcher and reducing resource usage. The app must remain accessible at port 5174 so existing phone bookmarks continue to work.

## Current State

- Two processes run via `npm run dev` (via `concurrently`):
  - Vite dev server on port 5174 (frontend)
  - Express on port 3001 (backend)
- Vite proxies `/api` calls to Express during dev

## Target State

- One process: Express on port 5174
- Express serves the pre-built React frontend as static files from `frontend/dist/`
- Express handles all `/api/*` routes as before
- SPA catch-all (`GET *`) returns `index.html` for client-side routing
- `start.sh` builds the frontend if `dist/` is missing, then starts Express

## Architecture

```
Client (phone/browser)
        │
        ▼
Express :5174
  ├── /api/*  → route handlers (existing)
  └── /*      → static files from frontend/dist/
               (catch-all returns index.html for SPA routing)
```

## File Changes

### `backend/server.js`
Add `const path = require('path')` and append static file serving after all API routes:
```js
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```
Note: Uses CommonJS `__dirname` (already global) — no ES module import trick needed.

### `backend/package.json`
Add `"start": "node server.js"` to scripts.

### Root `package.json`
Add:
- `"build": "npm run build --prefix frontend"`
- `"start": "npm run start --prefix backend"`

### `start.sh`
Replace with:
```bash
#!/bin/bash
cd /Users/skafiskafnjak/Documents/claude.code/betcouple
if [ ! -d "frontend/dist" ]; then
  npm run build
fi
npm run start >> betcouple.log 2>&1
```

### `backend/.env`
Change `PORT=3001` → `PORT=5174`

### `frontend/vite.config.js`
No changes — the `/api` proxy only applies in dev mode.

## Constraints

- PORT must be 5174 to preserve existing phone bookmarks
- `start.sh` only builds when `dist/` is absent (not on every run)

## Verification

```
npm run build          # builds frontend/dist/
npm run start          # starts Express on :5174
curl http://localhost:5174        # should return index.html
curl http://localhost:5174/api/state  # should return JSON
```
