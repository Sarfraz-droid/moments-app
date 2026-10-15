import type { CapturedMediaKind } from '@/components/in-app-camera';

export type PendingMedia = { uri: string; kind: CapturedMediaKind };

// Hands a just-captured/picked media URI from the camera screen to the compose
// screen via an in-memory value rather than a router query param — local
// file/content:// URIs can contain characters (%, :, /) that get mangled by
// Expo Router's URL-based param encoding/decoding round-trip, which broke
// both the photo and video preview after a capture.
let pendingMedia: PendingMedia | null = null;

export function setPendingMedia(media: PendingMedia | null) {
  pendingMedia = media;
}

export function takePendingMedia(): PendingMedia | null {
  const media = pendingMedia;
  pendingMedia = null;
  return media;
}
