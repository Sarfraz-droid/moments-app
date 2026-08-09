import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { loading, joinPair } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !code) return;
    joinPair(code)
      .then(() => router.replace('/'))
      .catch(() => setError('Code galat hai ya expire ho gaya.'));
  }, [loading, code, joinPair]);

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ThemedText>{error ?? 'Connecting…'}</ThemedText>
    </ThemedView>
  );
}
