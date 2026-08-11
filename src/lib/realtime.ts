let channelSequence = 0;

/**
 * Supabase Realtime reuses a live channel when its topic matches. React's
 * development remount can run before async channel cleanup finishes, so a
 * stable topic may return an already-subscribed channel that rejects new
 * postgres_changes handlers. Each effect subscription gets its own topic.
 */
export function uniqueRealtimeTopic(prefix: string) {
  channelSequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${channelSequence}-${Math.random().toString(36).slice(2, 8)}`;
}
