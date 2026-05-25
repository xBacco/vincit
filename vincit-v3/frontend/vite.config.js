import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Capacitor serves assets from file:// (or capacitor://localhost), so paths
  // must be relative. The standard web build keeps the default '/'.
  base: mode === 'capacitor' ? './' : '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Proxy target configurable so the dev UI can point at a remote backend
    // (es. produzione) per il viewing del restyle senza problemi CORS.
    // Default invariato: backend locale su :3001.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3001',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    // Vite's default chunk-size warning threshold (500kb) is conservative
    // — bump it slightly so the warning only fires on genuine bloat now
    // that the heavy stuff is split off into per-route chunks anyway.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Keep the React runtime + Sentry in their own dedicated chunks
        // so a small app-code change doesn't bust their cached copies.
        // Everything else falls into the default chunking + the dynamic
        // imports we added via React.lazy.
        manualChunks: {
          react:  ['react', 'react-dom'],
          sentry: ['@sentry/react'],
        },
      },
    },
  },
}));
