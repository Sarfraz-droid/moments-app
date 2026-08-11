import { supabase } from '@/lib/supabase';

export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

/** Toggles the given user's reaction on a moment: same emoji removes it,
 * a different emoji replaces it (one reaction per person per moment). */
export async function toggleReaction(
  momentId: string,
  pairId: string,
  userId: string,
  emoji: string
) {
  const { data: existing } = await supabase
    .from('moment_reactions')
    .select('id, emoji')
    .eq('moment_id', momentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing && existing.emoji === emoji) {
    await supabase.from('moment_reactions').delete().eq('id', existing.id);
    return;
  }

  await supabase
    .from('moment_reactions')
    .upsert(
      { moment_id: momentId, pair_id: pairId, user_id: userId, emoji },
      { onConflict: 'moment_id,user_id' }
    );
}
