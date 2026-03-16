import { useEffect, useRef, useCallback, useState } from 'react';
import { alarmsApi } from '@/services/api';
import { AlarmRecord } from '@/types';

export function useGallagherAlarms() {
  const [alarms, setAlarms] = useState<AlarmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await alarmsApi.fetchInitial();
      setAlarms(res.data.alarms);
      cursorRef.current = res.data.cursor?.alarmsNextHref;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const pollUpdates = useCallback(async () => {
    if (!cursorRef.current) return;
    try {
      const res = await alarmsApi.fetchUpdates();
      if (res.data.alarms.length > 0) {
        setAlarms((prev) => {
          // Deduplicate by id (newest last)
          const map = new Map<string, AlarmRecord>();
          [...prev, ...res.data.alarms].forEach((a) => map.set(a.id, a));
          return Array.from(map.values());
        });
      }
      cursorRef.current = res.data.cursor?.alarmsNextHref;
    } catch (e) {
      console.error('Polling failed:', e);
      cursorRef.current = undefined; // force full reload next time
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Start polling
  useEffect(() => {
    if (loading) return;
    pollingRef.current = window.setInterval(() => {
      pollUpdates();
    }, 15000); // cada 15s (ajustable)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loading, pollUpdates]);

  const acknowledge = useCallback(async (id: string) => {
    await alarmsApi.acknowledge(id);
    setAlarms((prev) => prev.map(a => a.id === id ? { ...a, state: 'acknowledged' as const } : a));
  }, []);

  const clear = useCallback(async (id: string) => {
    await alarmsApi.clear(id);
    setAlarms((prev) => prev.map(a => a.id === id ? { ...a, state: 'cleared' as const } : a));
  }, []);

  return {
    alarms,
    loading,
    error,
    refresh: fetchInitial,
    acknowledge,
    clear,
  };
}
