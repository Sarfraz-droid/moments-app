import { Redirect, usePathname } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRegisterPushToken } from '@/hooks/use-register-push-token';
import { useWidgetSync } from '@/hooks/use-widget-sync';
import { useAuth } from '@/lib/auth-context';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, session, profile, pair } = useAuth();
  const pathname = usePathname();

  useRegisterPushToken(session?.user.id);

  // Keep the home-screen widget's cached moment fresh for the active pair,
  // even when the user is on a screen that doesn't mount the feed (Send tab,
  // onboarding, account modal, …). Without this, partner-sent moments don't
  // reach the widget until the user manually opens the feed.
  // The background-notification task is registered in index.js at app boot,
  // so it covers the "app fully killed" case via push.
  useWidgetSync(pair?.id);

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  const needsAuth = !session;
  const needsName = !profile || profile.display_name === 'Someone';
  const needsPair = !pair || pair.status !== 'active';
  const onOnboarding = pathname.startsWith('/onboarding');
  const onJoin = pathname.startsWith('/join');
  const linkingPhone = pathname === '/onboarding/phone' && session?.user.is_anonymous;

  if (needsAuth) {
    if (pathname !== '/onboarding/welcome' && pathname !== '/onboarding/phone' && !onJoin) {
      return <Redirect href="/onboarding/welcome" />;
    }
    return children;
  }

  if (needsName) {
    if (pathname !== '/onboarding/name' && !onJoin) return <Redirect href="/onboarding/name" />;
    return children;
  }

  if (needsPair) {
    if (pathname !== '/onboarding/pair' && !onJoin) return <Redirect href="/onboarding/pair" />;
    return children;
  }

  // An anonymous user can attach a phone number without abandoning their
  // existing profile, pair, and moments. This route used to be caught by the
  // general onboarding redirect below, making the account button jump home.
  if (linkingPhone) {
    return children;
  }

  if (onOnboarding) {
    return <Redirect href="/" />;
  }

  return children;
}
