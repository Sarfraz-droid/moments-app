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
  partnerProfile: Profile | null;
  continueAnonymously: () => Promise<void>;
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
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);

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

  const loadUserData = useCallback(
    async (userId: string) => {
      const loadedProfile = await loadProfile(userId);
      setProfile(loadedProfile);
      await loadPair(userId);
    },
    [loadProfile, loadPair]
  );

  // Unlike before, no anonymous sign-in happens automatically here — the user
  // picks Google, phone, or "continue as guest" on the welcome screen, so the
  // choice actually means something instead of being pre-empted at boot.
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        await loadUserData(data.session.user.id);
      }
      if (!mounted) return;
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadUserData(newSession.user.id).catch(() => {});
      } else {
        setProfile(null);
        setPair(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUserData]);

  useEffect(() => {
    if (pair?.status === 'active') {
      AsyncStorage.setItem(WIDGET_PAIR_ID_KEY, pair.id).catch(() => {});
    }
  }, [pair]);

  useEffect(() => {
    if (!pair || pair.status !== 'active' || !session) {
      setPartnerProfile(null);
      return;
    }
    const partnerId = pair.user_a === session.user.id ? pair.user_b : pair.user_a;
    if (!partnerId) {
      setPartnerProfile(null);
      return;
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .maybeSingle()
      .then(({ data }) => setPartnerProfile((data as Profile) ?? null));
  }, [pair, session]);

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

  const continueAnonymously = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }, []);

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
    () => ({
      loading,
      session,
      profile,
      pair,
      partnerProfile,
      continueAnonymously,
      setDisplayName,
      createPair,
      joinPair,
      refreshPair,
    }),
    [
      loading,
      session,
      profile,
      pair,
      partnerProfile,
      continueAnonymously,
      setDisplayName,
      createPair,
      joinPair,
      refreshPair,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
