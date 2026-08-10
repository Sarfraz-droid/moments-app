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
  type: 'photo' | 'note';
  storage_path: string | null;
  text: string | null;
  created_at: string;
};

export type MomentReaction = {
  id: string;
  moment_id: string;
  pair_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};
