import { Redirect, usePathname } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRegisterPushToken } from '@/hooks/use-register-push-token';
import { useAuth } from '@/lib/auth-context';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, session, profile, pair } = useAuth();
  const pathname = usePathname();

  useRegisterPushToken(session?.user.id);

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  const needsName = !profile || profile.display_name === 'Someone';
  const needsPair = !pair || pair.status !== 'active';
  const onOnboarding = pathname.startsWith('/onboarding');
  const onJoin = pathname.startsWith('/join');

  if (needsName) {
    if (pathname !== '/onboarding/name' && !onJoin) return <Redirect href="/onboarding/name" />;
    return children;
  }

  if (needsPair) {
    if (pathname !== '/onboarding/pair' && !onJoin) return <Redirect href="/onboarding/pair" />;
    return children;
  }

  if (onOnboarding) {
    return <Redirect href="/" />;
  }

  return children;
}
