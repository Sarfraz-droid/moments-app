import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Moment } from '@/lib/types';
import { syncLatestMomentToWidget } from '@/lib/widget-cache';

export function useMoments(pairId: string | undefined) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);

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
    syncLatestMomentToWidget(pairId).catch(() => {});
  }, [pairId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!pairId) return;
    const channel = supabase
      .channel(`moments-${pairId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moments', filter: `pair_id=eq.${pairId}` },
        (payload) => {
          setMoments((prev) => [payload.new as Moment, ...prev]);
          syncLatestMomentToWidget(pairId).catch(() => {});
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairId]);

  return { moments, loading, refresh: load };
}
