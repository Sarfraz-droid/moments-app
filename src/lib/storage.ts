import { supabase } from '@/lib/supabase';

const BUCKET = 'moments-photos';

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
  // 24h expiry: the Android widget caches this URL and can only refresh it when
  // the app runs (foreground or a push-triggered background sync), not on its own.
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24);
  if (error) throw error;
  return data.signedUrl;
}
