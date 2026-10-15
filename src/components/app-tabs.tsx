import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';

type TabKind = 'home' | 'profile';

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <Tabs>
      <TabSlot style={styles.content} />
      <TabList asChild>
        <View
          style={StyleSheet.flatten([
            styles.tabBar,
            {
              paddingBottom: Math.max(insets.bottom, Spacing.two),
              backgroundColor: theme.background,
              borderTopColor: theme.divider,
            },
          ])}>
          <TabTrigger name="home" href="/" asChild>
            <TabButton kind="home" label="Home" />
          </TabTrigger>
          <SendButton />
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton kind="profile" label="Profile" />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

function SendButton() {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityLabel="Send a moment"
      accessibilityRole="button"
      onPress={() => router.push('/camera')}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.sendHitArea}>
      <MotiView
        animate={{ scale: reducedMotion ? 1 : pressed ? 0.92 : 1, translateY: pressed && !reducedMotion ? 2 : 0 }}
        transition={{ type: 'timing', duration: reducedMotion ? 0 : 110 }}
        style={[
          styles.sendButton,
          { backgroundColor: theme.brand, borderColor: theme.brand },
        ]}>
        <SymbolView
          name={{ ios: 'plus', android: 'add', web: 'add' }}
          size={28}
          tintColor="#FFFFFF"
        />
      </MotiView>
    </Pressable>
  );
}

function TabButton({ kind, label, isFocused, ...props }: TabTriggerSlotProps & { kind: TabKind; label: string }) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  const isHome = kind === 'home';
  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={styles.tabButton}>
      <MotiView
        animate={{
          opacity: pressed ? 0.72 : 1,
          scale: reducedMotion ? 1 : pressed ? 0.9 : isFocused ? 1.06 : 1,
          translateY: isFocused && !reducedMotion ? -1 : 0,
        }}
        transition={{ type: 'timing', duration: reducedMotion ? 0 : 140 }}
        style={styles.tabContent}>
        <SymbolView
          name={
            isHome
              ? {
                  ios: isFocused ? 'house.fill' : 'house',
                  android: 'home',
                  web: 'home',
                }
              : {
                  ios: isFocused ? 'person.crop.circle.fill' : 'person.crop.circle',
                  android: 'account_circle',
                  web: 'account_circle',
                }
          }
          size={23}
          tintColor={isFocused ? theme.brand : theme.textSecondary}
        />
        <ThemedText
          type="small"
          style={[styles.tabLabel, { color: isFocused ? theme.brand : theme.textSecondary }]}>
          {label}
        </ThemedText>
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  tabBar: {
    minHeight: 64,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  tabLabel: { fontSize: 11, lineHeight: 16 },
  sendHitArea: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ translateY: -18 }],
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
});
