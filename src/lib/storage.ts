import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Image as RNImage } from 'react-native';

import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from '@/lib/supabase';

const BUCKET = 'moments-photos';
const WIDGET_IMAGE_DIRECTORY = new Directory(Paths.cache, 'widget-images');
const VIDEO_CACHE_DIRECTORY = new Directory(Paths.cache, 'moment-videos');

const MEDIA_KIND_CONFIG = {
  photo: { extension: 'jpg', contentType: 'image/jpeg' },
  video: { extension: 'mp4', contentType: 'video/mp4' },
} as const;

// Camera/gallery photos can come in at full sensor resolution (several MB) —
// the feed only ever displays them at up to screen width, and the lightbox
// at up to screen height, so anything beyond ~1440px on the long side is
// wasted upload/download bandwidth with no visible quality gain.
const MAX_PHOTO_DIMENSION = 1440;
const PHOTO_COMPRESS_QUALITY = 0.75;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function optimizePhoto(uri: string): Promise<string> {
  try {
    const { width } = await getImageSize(uri);
    // Only downscale, never upscale — a gallery pick already under the cap
    // just gets recompressed.
    let context = ImageManipulator.manipulate(uri);
    if (width > MAX_PHOTO_DIMENSION) {
      context = context.resize({ width: MAX_PHOTO_DIMENSION });
    }
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_COMPRESS_QUALITY });
    return saved.uri;
  } catch {
    // If optimization fails for any reason, upload the original rather than blocking the send.
    return uri;
  }
}

// The Supabase JS client's storage.upload() doesn't expose upload progress —
// posting directly to the Storage REST endpoint via XMLHttpRequest lets the
// compose screen show a real progress bar for video uploads, which can take
// a while on a slow connection. React Native's networking layer only reports
// xhr.upload.onprogress reliably when the body is a Blob — a raw ArrayBuffer
// body silently never fires progress events on some RN/platform versions,
// which looked like "no progress" rather than an error.
function uploadWithProgress(path: string, body: Blob, contentType: string, onProgress?: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const accessToken = session?.access_token;
      if (!accessToken) {
        reject(new Error('Not authenticated'));
        return;
      }
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.setRequestHeader('x-upsert', 'true');
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onProgress(event.loaded / event.total);
        };
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(body);
    }, reject);
  });
}

export async function uploadMomentMedia(
  pairId: string,
  momentId: string,
  uri: string,
  kind: keyof typeof MEDIA_KIND_CONFIG,
  onProgress?: (fraction: number) => void
) {
  const { extension, contentType } = MEDIA_KIND_CONFIG[kind];
  const optimizedUri = kind === 'photo' ? await optimizePhoto(uri) : uri;
  const response = await fetch(optimizedUri);
  const blob = await response.blob();
  const path = `${pairId}/${momentId}.${extension}`;
  await uploadWithProgress(path, blob, contentType, onProgress);
  return path;
}

export async function uploadMomentPhoto(pairId: string, momentId: string, uri: string) {
  return uploadMomentMedia(pairId, momentId, uri, 'photo');
}

// Every MomentCard/lightbox/widget-sync call for the same storage_path used to
// hit Supabase's API for a brand-new signed URL before the actual media could
// even start downloading — on re-renders, re-opening the lightbox, or
// scrolling back to an earlier moment, that round trip was pure added latency
// for a URL that hadn't changed. Cached here (slightly under the real 24h
// signed-URL validity) so repeat calls resolve instantly; concurrent calls
// for the same path also share one in-flight request instead of firing twice.
const SIGNED_URL_TTL_MS = 23 * 60 * 60 * 1000;
const resolvedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const pendingUrlRequests = new Map<string, Promise<string>>();

export async function getMomentPhotoUrl(path: string): Promise<string> {
  const cached = resolvedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const pending = pendingUrlRequests.get(path);
  if (pending) return pending;

  const request = supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24)
    .then(({ data, error }) => {
      if (error) throw error;
      resolvedUrlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_URL_TTL_MS });
      return data.signedUrl;
    })
    .finally(() => {
      pendingUrlRequests.delete(path);
    });

  pendingUrlRequests.set(path, request);
  return request;
}

/** Downloads a widget photo before redraw so Android RemoteViews never has to
 * race a network request while constructing the widget. The native widget
 * renderer supports file:// sources even though its public TypeScript type
 * currently lists only remote and data URLs. */
export async function getMomentPhotoForWidget(path: string, momentId: string) {
  const signedUrl = await getMomentPhotoUrl(path);

  try {
    WIDGET_IMAGE_DIRECTORY.create({ intermediates: true, idempotent: true });
    const destination = new File(WIDGET_IMAGE_DIRECTORY, `${momentId}.jpg`);
    const downloaded = await File.downloadFileAsync(signedUrl, destination, { idempotent: true });
    return downloaded.uri;
  } catch {
    // Retain the existing remote-image fallback if local caching is unavailable.
    return signedUrl;
  }
}

// Feed video playback used to hand VideoView a fresh signed URL on every
// mount, so scrolling a video off-screen and back (or reopening the app)
// re-streamed and re-buffered the whole clip from the network each time —
// unlike photos, which expo-image caches to disk automatically. Videos are
// capped at 30s/720p/~2.5Mbps at capture time (see in-app-camera.tsx), so a
// full download-then-play from local disk is cheap and, once cached, makes
// repeat playback instant with no re-buffering.
const videoUriCache = new Map<string, string>();
const pendingVideoDownloads = new Map<string, Promise<string>>();

export async function getMomentVideoUri(path: string, momentId: string): Promise<string> {
  const cached = videoUriCache.get(momentId);
  if (cached) return cached;

  const pending = pendingVideoDownloads.get(momentId);
  if (pending) return pending;

  const request = (async () => {
    VIDEO_CACHE_DIRECTORY.create({ intermediates: true, idempotent: true });
    const destination = new File(VIDEO_CACHE_DIRECTORY, `${momentId}.mp4`);
    if (destination.exists) {
      videoUriCache.set(momentId, destination.uri);
      return destination.uri;
    }
    const signedUrl = await getMomentPhotoUrl(path);
    try {
      const downloaded = await File.downloadFileAsync(signedUrl, destination, { idempotent: true });
      videoUriCache.set(momentId, downloaded.uri);
      return downloaded.uri;
    } catch {
      // Local caching failed (e.g. disk full) — fall back to streaming the signed URL directly.
      return signedUrl;
    }
  })();
  request.finally(() => pendingVideoDownloads.delete(momentId));
  pendingVideoDownloads.set(momentId, request);
  return request;
}

/** RemoteViews widgets have no video primitive and can't animate a GIF either
 * (Android's widget ImageView only ever shows a single static frame) — so
 * video moments get a still thumbnail frame instead of being skipped
 * entirely. Downloads the clip locally (same reasoning as getMomentPhotoForWidget)
 * then extracts a frame with expo-video-thumbnails. */
export async function getMomentVideoThumbnailForWidget(path: string, momentId: string) {
  const signedUrl = await getMomentPhotoUrl(path);

  try {
    WIDGET_IMAGE_DIRECTORY.create({ intermediates: true, idempotent: true });
    const videoDestination = new File(WIDGET_IMAGE_DIRECTORY, `${momentId}.mp4`);
    const downloadedVideo = await File.downloadFileAsync(signedUrl, videoDestination, { idempotent: true });
    const { uri } = await VideoThumbnails.getThumbnailAsync(downloadedVideo.uri, { time: 100 });
    return uri;
  } catch {
    return null;
  }
}
