import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useMoments } from '@/hooks/use-moments';
import { useAuth } from '@/lib/auth-context';
import { getMomentPhotoUrl } from '@/lib/storage';
import type { Moment } from '@/lib/types';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function MomentCard({ moment, isMe }: { moment: Moment; isMe: boolean }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (moment.type === 'photo' && moment.storage_path) {
      getMomentPhotoUrl(moment.storage_path)
        .then(setUrl)
        .catch(() => setUrl(null));
    }
  }, [moment]);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {moment.type === 'photo' ? (
        url ? (
          <Image source={{ uri: url }} style={styles.photo} contentFit="cover" />
        ) : (
          <ThemedView style={[styles.photo, styles.photoLoading]} />
        )
      ) : (
        <ThemedText style={styles.noteText}>{moment.text}</ThemedText>
      )}
      <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
        {isMe ? 'You' : 'Them'} · {timeAgo(moment.created_at)}
      </ThemedText>
    </ThemedView>
  );
}

export default function FeedScreen() {
  const { session, pair } = useAuth();
  const { moments, loading, refresh } = useMoments(pair?.id);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={moments}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refresh}
          refreshing={loading}
          ListHeaderComponent={
            <ThemedText type="title" style={styles.header}>
              Moments 💛
            </ThemedText>
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                Koi photo/note nahi abhi. Send tab se bhejo!
              </ThemedText>
            ) : null
          }
          renderItem={({ item }) => (
            <MomentCard moment={item} isMe={item.sender_id === session?.user.id} />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingBottom: BottomTabInset,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: { padding: Spacing.three, gap: Spacing.three },
  header: { fontSize: 28, marginBottom: Spacing.two },
  empty: { textAlign: 'center', marginTop: Spacing.six },
  card: { borderRadius: Spacing.three, padding: Spacing.two, gap: Spacing.two },
  photo: { width: '100%', aspectRatio: 1, borderRadius: Spacing.two },
  photoLoading: { backgroundColor: '#00000022' },
  noteText: { fontSize: 20, padding: Spacing.three },
  meta: { paddingHorizontal: Spacing.one },
});
