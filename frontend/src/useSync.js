import { useEffect, useCallback } from 'react';
import { fetchState } from './api.js';

export function useSync(setState) {
  const refresh = useCallback(async () => {
    try {
      const data = await fetchState();
      setState(data);
    } catch (e) {
      console.error('fetchState failed:', e);
    }
  }, [setState]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const es = new EventSource('/api/events');
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'update') refresh();
    };
    es.onerror = () => {};
    return () => es.close();
  }, [refresh]);

  return refresh;
}
