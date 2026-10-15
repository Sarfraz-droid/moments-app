export type YoutubeTrack = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  startSeconds?: number;
};

const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;

export class YoutubeSearchError extends Error {}

export async function searchYoutubeMusic(query: string): Promise<YoutubeTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  if (!API_KEY) {
    throw new YoutubeSearchError('Music search is not configured yet.');
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('videoCategoryId', '10'); // Music
  url.searchParams.set('maxResults', '15');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('key', API_KEY);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new YoutubeSearchError('Could not reach YouTube. Check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new YoutubeSearchError('YouTube search is temporarily unavailable (quota exceeded).');
    }
    throw new YoutubeSearchError('YouTube search failed. Try again.');
  }

  const json = await response.json();
  const items: unknown[] = Array.isArray(json.items) ? json.items : [];

  return items
    .map((item): YoutubeTrack | null => {
      const record = item as {
        id?: { videoId?: string };
        snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string }; default?: { url?: string } } };
      };
      const videoId = record.id?.videoId;
      if (!videoId) return null;
      return {
        videoId,
        title: record.snippet?.title ?? 'Untitled track',
        channelTitle: record.snippet?.channelTitle ?? '',
        thumbnailUrl: record.snippet?.thumbnails?.medium?.url ?? record.snippet?.thumbnails?.default?.url ?? '',
      };
    })
    .filter((track): track is YoutubeTrack => track !== null);
}

// ISO 8601 duration like "PT4M13S" or "PT58S" -> seconds.
function parseIsoDuration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
}

export async function fetchVideoDurationSeconds(videoId: string): Promise<number> {
  if (!API_KEY) throw new YoutubeSearchError('Music search is not configured yet.');

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', API_KEY);

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new YoutubeSearchError('Could not reach YouTube. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new YoutubeSearchError('Could not load this track. Try another.');
  }

  const json = await response.json();
  const iso: string | undefined = json.items?.[0]?.contentDetails?.duration;
  if (!iso) throw new YoutubeSearchError('Could not load this track. Try another.');
  return parseIsoDuration(iso);
}
