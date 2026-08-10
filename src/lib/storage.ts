import { Directory, File, Paths } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

const BUCKET = 'moments-photos';
const WIDGET_IMAGE_DIRECTORY = new Directory(Paths.cache, 'widget-images');

export async function uploadMomentPhoto(pairId: string, momentId: string, uri: string) {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${pairId}/${momentId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function getMomentPhotoUrl(path: string) {
  // Long enough for feed rendering and for the widget sync to download a local copy.
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
  if (error) throw error;
  return data.signedUrl;
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
