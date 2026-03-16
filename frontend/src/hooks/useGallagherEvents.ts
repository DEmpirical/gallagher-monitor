import { useEffect, useRef, useCallback, useState } from 'react';
import { eventsApi } from '@/services/api';
import { useFiltersStore } from '@/store/filtersStore';
import { EventRecord } from '@/types';

export function useGallagherEvents() {
  const filtersStore = useFiltersStore();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsApi.fetchInitial(filtersStore.filters);
      setEvents(res.data.events);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filtersStore.filters]);

  // Refetch when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitial();
    }, 500);
    return () => clearTimeout(timer);
  }, [filtersStore.filters, fetchInitial]);

  const pollUpdates = useCallback(async () => {
    try {
      const res = await eventsApi.fetchUpdates();
      if (res.data.events.length > 0) {
        setEvents((prev) => {
          const map = new Map<string, EventRecord>();
          [...prev, ...res.data.events].forEach((e) => map.set(e.id, e));
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.error('Event polling failed:', e);
    }
  }, []);

  // Start polling after initial load
  useEffect(() => {
    if (loading) return;
    pollingRef.current = window.setInterval(() => {
      pollUpdates();
    }, 15000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loading, pollUpdates]);

  return {
    events,
    loading,
    error,
    refresh: fetchInitial,
  };
}
