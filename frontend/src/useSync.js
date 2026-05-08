import { useEffect, useCallback } from 'react';
import { fetchState } from './api.js';

export function useSync(setState, roomId, token) {
  const ready = !!(roomId && token);

  const refresh = useCallback(async () => {
    if (!ready) return;
    try {
      const data = await fetchState();
      setState(data);
    } catch (e) {
      console.error('fetchState failed:', e);
    }
  }, [setState, ready]);

  useEffect(() => {
    if (!ready) return;
    refresh();
  }, [refresh, ready]);

  useEffect(() => {
    if (!ready) return;
    const es = new EventSource(`/api/state/stream?token=${encodeURIComponent(token)}`);
    es.onmessage = () => refresh();
    es.onerror   = () => { es.close(); };
    return () => es.close();
  }, [ready, token, refresh]);

  return refresh;
}
