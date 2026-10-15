export type Profile = {
  id: string;
  display_name: string;
  expo_push_token: string | null;
  created_at: string;
};

export type Pair = {
  id: string;
  user_a: string;
  user_b: string | null;
  invite_code: string;
  status: 'pending' | 'active';
  created_at: string;
};

export type Moment = {
  id: string;
  pair_id: string;
  sender_id: string;
  type: 'photo' | 'note' | 'video';
  storage_path: string | null;
  text: string | null;
  created_at: string;
  youtube_video_id: string | null;
  track_title: string | null;
  track_artist_channel: string | null;
  track_thumbnail_url: string | null;
  track_start_seconds: number | null;
};

export type MomentReaction = {
  id: string;
  moment_id: string;
  pair_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type MomentComment = {
  id: string;
  moment_id: string;
  pair_id: string;
  user_id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
};
