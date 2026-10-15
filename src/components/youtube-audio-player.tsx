import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

type Props = {
  videoId: string;
  startSeconds?: number;
  playing: boolean;
  onError?: (message: string) => void;
};

// Loads YouTube's IFrame Player API (rather than the bare /embed/ URL) so
// playback is driven by an explicit player.playVideo() call after onReady —
// letting `autoplay=1` alone decide playback is unreliable inside a nested
// WebView on some Android versions. Also lets us detect and surface real
// failures (video not embeddable, removed, etc.) instead of silently playing
// nothing. Audio-only: rendered at 1x1/opacity 0, never a visible video frame.
function buildPlayerHtml(videoId: string, startSeconds: number) {
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#000;">
<div id="player"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
  var player;
  function post(payload) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
      height: '100%',
      width: '100%',
      videoId: '${videoId}',
      playerVars: { autoplay: 1, playsinline: 1, controls: 0, start: ${startSeconds} },
      events: {
        onReady: function (e) { e.target.playVideo(); post({ type: 'ready' }); },
        onError: function (e) { post({ type: 'error', code: e.data }); }
      }
    });
  }
</script>
</body>
</html>`;
}

// Codes per the IFrame Player API's onError event. 101/150 specifically mean
// the video's owner has disabled embedding outside youtube.com — that's a
// per-video restriction on their end, not something fixable from here.
const ERROR_MESSAGES: Record<number, string> = {
  2: 'This track is unavailable.',
  5: 'This track can’t be played here.',
  100: 'This track was not found.',
  101: 'The artist has disabled previews for this track.',
  150: 'The artist has disabled previews for this track.',
};

export function YoutubeAudioPlayer({ videoId, startSeconds = 0, playing, onError }: Props) {
  if (!playing) return null;
  const clampedStart = Math.max(0, Math.floor(startSeconds));

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'error') {
        console.warn('[YoutubeAudioPlayer] player error code', payload.code, 'for video', videoId);
        onError?.(ERROR_MESSAGES[payload.code] ?? 'This track can’t be previewed.');
      }
    } catch {
      // Ignore malformed/unexpected messages from the embedded player.
    }
  }

  return (
    <WebView
      key={`${videoId}-${clampedStart}`}
      style={styles.hidden}
      originWhitelist={['*']}
      // baseUrl gives the inline HTML a real https origin instead of
      // about:blank (which the IFrame API can reject outright), but it must
      // NOT be youtube.com itself — that made the player self-referential
      // and produced undocumented error codes (e.g. 152) instead of playing.
      // Any neutral https domain works since nothing is actually fetched from it.
      source={{ html: buildPlayerHtml(videoId, clampedStart), baseUrl: 'https://example.com' }}
      javaScriptEnabled
      domStorageEnabled
      thirdPartyCookiesEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      onMessage={handleMessage}
    />
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
