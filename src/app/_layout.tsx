import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthGate } from '@/components/auth-gate';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth-context';

/*
THESIS: Moments is a private, media-first feed for two; it refuses public-social clutter and decorative scrapbook chrome.
OWN-WORLD: Neutral system surfaces, crisp separators, friendly Poppins typography, full-width media, and one coral interaction color.
STORY: See the latest moment, understand who sent it, react only when desired, then send one back.
FIRST VIEWPORT: A slim native title bar sits above one generous latest moment; compact context and actual reactions follow; Home and Send remain familiar.
FORM: Polished category-standard native photo sharing, benchmarked against Instagram; seed e8d755c6.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const palette = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AuthProvider>
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'default',
                gestureEnabled: true,
                contentStyle: { backgroundColor: palette.background },
              }}>
              <Stack.Screen
                name="send-sheet"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  animationTypeForReplace: 'push',
                  gestureDirection: 'vertical',
                }}
              />
              <Stack.Screen
                name="comments-sheet"
                options={{
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.96],
                  sheetInitialDetentIndex: 0,
                  sheetGrabberVisible: true,
                  sheetCornerRadius: 28,
                }}
              />
              <Stack.Screen
                name="music-search-sheet"
                options={{
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.96],
                  sheetInitialDetentIndex: 0,
                  sheetGrabberVisible: true,
                  sheetCornerRadius: 28,
                }}
              />
              <Stack.Screen
                name="camera"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  gestureDirection: 'vertical',
                }}
              />
              <Stack.Screen
                name="account"
                options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
              />
            </Stack>
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
