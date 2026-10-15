import type { YoutubeTrack } from '@/lib/youtube';

// Passes the selected track back from the /music-search-sheet route to whichever
// screen opened it — router params only carry serializable strings, so a
// callback held in-memory works fine since it's the same JS runtime.
let onSelect: ((track: YoutubeTrack) => void) | null = null;

export function setMusicSelectHandler(handler: (track: YoutubeTrack) => void) {
  onSelect = handler;
}

export function resolveMusicSelect(track: YoutubeTrack) {
  onSelect?.(track);
  onSelect = null;
}

export function clearMusicSelectHandler() {
  onSelect = null;
}
