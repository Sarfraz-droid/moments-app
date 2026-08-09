import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Pair, Profile } from '@/lib/types';
import { WIDGET_PAIR_ID_KEY } from '@/lib/widget-cache';

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  pair: Pair | null;
  setDisplayName: (name: string) => Promise<void>;
  createPair: () => Promise<Pair>;
  joinPair: (inviteCode: string) => Promise<Pair>;
  refreshPair: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pair, setPair] = useState<Pair | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (existing) return existing as Profile;

    const { data: created, error } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select('*')
      .single();
    if (error) throw error;
    return created as Profile;
  }, []);

  const loadPair = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('pairs')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setPair((data as Pair) ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      let { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { data: signInData, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        data = { session: signInData.session };
      }
      if (!mounted || !data.session) return;
      setSession(data.session);
      const loadedProfile = await loadProfile(data.session.user.id);
      if (!mounted) return;
      setProfile(loadedProfile);
      await loadPair(data.session.user.id);
      if (!mounted) return;
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, loadPair]);

  useEffect(() => {
    if (pair?.status === 'active') {
      AsyncStorage.setItem(WIDGET_PAIR_ID_KEY, pair.id).catch(() => {});
    }
  }, [pair]);

  useEffect(() => {
    if (!pair || pair.status === 'active') return;
    const channel = supabase
      .channel(`pair-${pair.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pairs', filter: `id=eq.${pair.id}` },
        (payload) => setPair(payload.new as Pair)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pair]);

  const setDisplayName = useCallback(
    async (name: string) => {
      if (!session) return;
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('id', session.user.id)
        .select('*')
        .single();
      if (error) throw error;
      setProfile(data as Profile);
    },
    [session]
  );

  const createPair = useCallback(async () => {
    if (!session) throw new Error('Not signed in');
    const { data, error } = await supabase
      .from('pairs')
      .insert({ user_a: session.user.id, invite_code: makeInviteCode() })
      .select('*')
      .single();
    if (error) throw error;
    setPair(data as Pair);
    return data as Pair;
  }, [session]);

  const joinPair = useCallback(
    async (inviteCode: string) => {
      if (!session) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('pairs')
        .update({ user_b: session.user.id, status: 'active' })
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .eq('status', 'pending')
        .select('*')
        .single();
      if (error) throw error;
      setPair(data as Pair);
      return data as Pair;
    },
    [session]
  );

  const refreshPair = useCallback(async () => {
    if (!session) return;
    await loadPair(session.user.id);
  }, [session, loadPair]);

  const value = useMemo(
    () => ({ loading, session, profile, pair, setDisplayName, createPair, joinPair, refreshPair }),
    [loading, session, profile, pair, setDisplayName, createPair, joinPair, refreshPair]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
