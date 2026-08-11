import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/** Signs in with Google, or — if `linkToCurrentUser` is true — links a Google
 * identity onto the current (typically anonymous) session so the same
 * profile/pair/moments carry over instead of creating a new user. */
export async function signInWithGoogle(linkToCurrentUser: boolean) {
  // `path` is additive in Expo Linking. Passing "/" produces a slash-only
  // route that Expo Router can treat as unmatched once Supabase appends its
  // auth parameters; an empty path produces the scheme root (`scheme://`).
  const redirectTo = Linking.createURL('');
  const credentials = { provider: 'google' as const, options: { redirectTo, skipBrowserRedirect: true } };
  const { data, error } = linkToCurrentUser
    ? await supabase.auth.linkIdentity(credentials)
    : await supabase.auth.signInWithOAuth(credentials);
  if (error) throw error;
  if (!data?.url) throw new Error('No auth URL returned');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error(result.type === 'cancel' ? 'Cancelled' : 'Sign-in failed');
  }

  const url = new URL(result.url.replace('#', '?'));
  const code = url.searchParams.get('code');
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return;
  }

  const accessToken = url.searchParams.get('access_token');
  const refreshToken = url.searchParams.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error: setError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (setError) throw setError;
    return;
  }

  throw new Error('No auth code or tokens in redirect');
}
