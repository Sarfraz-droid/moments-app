const APP_SCHEME = 'homescreennotifiers:';

/**
 * Supabase was configured with `homescreennotifiers://*` as a literal fallback
 * URL. The wildcard is an allow-list pattern, not an app route. Keep stale
 * callbacks from reaching Expo Router's unmatched screen while the auth
 * session listener consumes the original URL and its tokens.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path, 'homescreennotifiers://app');
    const isLiteralWildcardCallback =
      url.protocol === APP_SCHEME && (url.hostname === '*' || url.pathname === '/*');

    return isLiteralWildcardCallback ? '/' : path;
  } catch {
    // Native intents may contain arbitrary strings. Never crash routing while
    // attempting to normalize one we do not recognize.
    return path;
  }
}
