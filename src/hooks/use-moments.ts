import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';
import { uniqueRealtimeTopic } from '@/lib/realtime';
import type { Moment } from '@/lib/types';
import { syncLatestMomentToWidget } from '@/lib/widget-cache';

export function useMoments(pairId: string | undefined) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const appState = useRef(AppState.currentState);

  const load = useCallback(async () => {
    if (!pairId) return;
    const { data, error } = await supabase
      .from('moments')
      .select('*')
      .eq('pair_id', pairId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) setMoments((data as Moment[]) ?? []);
    setLoading(false);
    // Also refresh the widget snapshot on every load so manual pull-to-refresh
    // and foreground resyncs correct any drift. The top-level useWidgetSync
    // hook covers the realtime case; this catches everything else.
    syncLatestMomentToWidget(pairId).catch(() => {});
  }, [pairId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Realtime's websocket can drop while the app is backgrounded (Android
  // especially), so silently missed inserts never arrive. Refetch whenever
  // the app comes back to the foreground as a safety net.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        load();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [load]);

  useEffect(() => {
    if (!pairId) return;
    const channel = supabase
      .channel(uniqueRealtimeTopic(`moments-${pairId}`))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moments', filter: `pair_id=eq.${pairId}` },
        (payload) => {
          const next = payload.new as Moment;
          setMoments((prev) => [next, ...prev.filter((moment) => moment.id !== next.id)]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairId]);

  return { moments, loading, refresh: load };
}
