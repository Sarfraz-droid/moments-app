import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { uniqueRealtimeTopic } from '@/lib/realtime';
import type { MomentComment } from '@/lib/types';

export function useComments(pairId: string | undefined) {
  const [comments, setComments] = useState<MomentComment[]>([]);

  const load = useCallback(async () => {
    if (!pairId) return;
    const { data, error } = await supabase
      .from('moment_comments')
      .select('*')
      .eq('pair_id', pairId)
      .order('created_at', { ascending: true });
    if (!error) setComments((data as MomentComment[]) ?? []);
  }, [pairId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!pairId) return;
    const channel = supabase
      .channel(uniqueRealtimeTopic(`moment-comments-${pairId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moment_comments', filter: `pair_id=eq.${pairId}` },
        (payload) => {
          setComments((prev) => {
            if (payload.eventType === 'DELETE') {
              const old = payload.old as MomentComment;
              return prev.filter((c) => c.id !== old.id);
            }
            const next = payload.new as MomentComment;
            const withoutExisting = prev.filter((c) => c.id !== next.id);
            return [...withoutExisting, next];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pairId]);

  async function addComment(
    momentId: string,
    pairId: string,
    userId: string,
    body: string,
    parentCommentId?: string | null
  ) {
    const { data, error } = await supabase
      .from('moment_comments')
      .insert({
        moment_id: momentId,
        pair_id: pairId,
        user_id: userId,
        body,
        parent_comment_id: parentCommentId ?? null,
      })
      .select('*')
      .single();
    if (!error && data) {
      setComments((prev) => [...prev.filter((c) => c.id !== data.id), data as MomentComment]);
    }
    return { data: data as MomentComment | null, error };
  }

  async function deleteComment(commentId: string) {
    await supabase.from('moment_comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_comment_id !== commentId));
  }

  return { comments, addComment, deleteComment };
}
