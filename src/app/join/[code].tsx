import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { loading, session, continueAnonymously, joinPair } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  // Ensure some session exists first — signInAnonymously updates auth state
  // asynchronously, so we wait for `session` to actually reflect it below
  // rather than chaining off the promise (whose closures would still see the
  // stale, unauthenticated `joinPair`).
  useEffect(() => {
    if (loading || session) return;
    continueAnonymously().catch(() => setError('Kuch gadbad ho gaya, dobara try karo.'));
  }, [loading, session, continueAnonymously]);

  useEffect(() => {
    if (loading || !code || !session || attempted.current) return;
    attempted.current = true;
    joinPair(code)
      .then(() => router.replace('/'))
      .catch(() => setError('Code galat hai ya expire ho gaya.'));
  }, [loading, code, session, joinPair]);

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ThemedText>{error ?? 'Connecting…'}</ThemedText>
    </ThemedView>
  );
}
