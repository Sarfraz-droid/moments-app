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
    continueAnonymously().catch(() => setError('We could not set up your account. Please try again.'));
  }, [loading, session, continueAnonymously]);

  useEffect(() => {
    if (loading || !code || !session || attempted.current) return;
    attempted.current = true;
    joinPair(code)
      .then(() => router.replace('/'))
      .catch(() => setError('That invite code is invalid or has expired.'));
  }, [loading, code, session, joinPair]);

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
      <ThemedText type="title">{error ? 'Could not connect' : 'Connecting…'}</ThemedText>
      {error ? <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>{error}</ThemedText> : null}
    </ThemedView>
  );
}
