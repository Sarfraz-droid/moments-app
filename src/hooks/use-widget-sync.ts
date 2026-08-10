import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { syncLatestMomentToWidget } from '@/lib/widget-cache';

/** Top-level subscription that keeps the home-screen widget in sync with
 * whatever the latest partner moment is. Mounted at the app root (via
 * AuthGate) so it stays alive regardless of which tab is on screen — without
 * this, a moment sent while the user is on the Send tab is invisible to the
 * widget because the feed's hook is unmounted there. */
export function useWidgetSync(pairId: string | undefined) {
  useEffect(() => {
    if (!pairId) return;

    // Hydrate immediately when the active pair becomes available. Realtime
    // only reports future inserts, so without this an already-added widget can
    // keep showing an old snapshot until another moment arrives.
    syncLatestMomentToWidget(pairId).catch(() => {});

    const channel = supabase
      .channel(`widget-sync-${pairId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moments', filter: `pair_id=eq.${pairId}` },
        () => {
          // Listen to every insert (including the user's own) — the widget
          // query itself filters out the sender's own moments, so the only
          // signal we need is "something new landed in this pair."
          syncLatestMomentToWidget(pairId).catch(() => {});
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairId]);
}
