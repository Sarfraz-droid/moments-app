import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { MomentReaction } from '@/lib/types';

export function useReactions(pairId: string | undefined) {
  const [reactions, setReactions] = useState<MomentReaction[]>([]);

  const load = useCallback(async () => {
    if (!pairId) return;
    const { data, error } = await supabase
      .from('moment_reactions')
      .select('*')
      .eq('pair_id', pairId);
    if (!error) setReactions((data as MomentReaction[]) ?? []);
  }, [pairId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!pairId) return;
    const channel = supabase
      .channel(`moment-reactions-${pairId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moment_reactions', filter: `pair_id=eq.${pairId}` },
        (payload) => {
          setReactions((prev) => {
            if (payload.eventType === 'DELETE') {
              const old = payload.old as MomentReaction;
              return prev.filter((r) => r.id !== old.id);
            }
            const next = payload.new as MomentReaction;
            const withoutExisting = prev.filter((r) => r.id !== next.id);
            return [...withoutExisting, next];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairId]);

  async function react(momentId: string, userId: string, emoji: string) {
    if (!pairId) return;
    const existing = reactions.find((r) => r.moment_id === momentId && r.user_id === userId);
    if (existing && existing.emoji === emoji) {
      await supabase.from('moment_reactions').delete().eq('id', existing.id);
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      return;
    }
    const { data, error } = await supabase
      .from('moment_reactions')
      .upsert(
        { moment_id: momentId, pair_id: pairId, user_id: userId, emoji },
        { onConflict: 'moment_id,user_id' }
      )
      .select('*')
      .single();
    if (!error && data) {
      setReactions((prev) => [...prev.filter((r) => r.id !== data.id), data as MomentReaction]);
    }
  }

  return { reactions, react };
}
