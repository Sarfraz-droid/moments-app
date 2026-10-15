import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CountdownRing } from '@/components/countdown-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export type CapturedMediaKind = 'photo' | 'video';

type Props = {
  onCapture: (uri: string, kind: CapturedMediaKind) => void;
  onSkip: () => void;
  onCancel: () => void;
};

const MAX_VIDEO_DURATION_SECONDS = 30;
const SHUTTER_SIZE = 72;
const CAMERA_READY_TIMEOUT_MS = 400;

// Renders the camera preview inline instead of launching the OS camera app
// (ImagePicker.launchCameraAsync) — leaving the app for an external Activity
// risks Android reclaiming/recreating ours in the background, which wipes
// in-progress state (photo, note draft, navigation). Staying in-process avoids that.
export function InAppCamera({ onCapture, onSkip, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [mode, setMode] = useState<'picture' | 'video'>('picture');
  const [capturing, setCapturing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const cameraReadyResolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!captureError) return;
    const timer = setTimeout(() => setCaptureError(null), 3000);
    return () => clearTimeout(timer);
  }, [captureError]);

  const handleCameraReady = useCallback(() => {
    cameraReadyResolveRef.current?.();
    cameraReadyResolveRef.current = null;
  }, []);

  // takePictureAsync is unreliable while CameraView is configured for video
  // capture on some devices ("Failed to capture image"), so mode is switched
  // to 'video' only for the duration of a hold-to-record gesture and back to
  // 'picture' immediately after — recordAsync is delayed until the native
  // preview confirms it reconfigured (onCameraReady), with a short timeout
  // fallback in case that event doesn't refire for a mode-only change.
  const waitForCameraReady = useCallback((timeoutMs: number) => {
    return new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        cameraReadyResolveRef.current = null;
        resolve();
      };
      cameraReadyResolveRef.current = finish;
      setTimeout(finish, timeoutMs);
    });
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing || recording) return;
    setCaptureError(null);
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, shutterSound: false });
      if (photo?.uri) onCapture(photo.uri, 'photo');
    } catch {
      setCaptureError('Could not take photo. Try again.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, onCapture, recording]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || capturing || recording) return;
    if (!micPermission?.granted) {
      const result = await requestMicPermission();
      if (!result.granted) return;
    }
    setCaptureError(null);
    setRecording(true);
    try {
      setMode('video');
      await waitForCameraReady(CAMERA_READY_TIMEOUT_MS);
      // Unconstrained recording defaults to a high bitrate/resolution, producing
      // large files that are slow to upload and slow to stream back in the feed
      // — capped via the CameraView's videoQuality/videoBitrate props below,
      // with codec set here since iOS only applies videoBitrate when it is.
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_DURATION_SECONDS,
        codec: 'avc1',
      });
      if (video?.uri) onCapture(video.uri, 'video');
    } catch {
      setCaptureError('Could not record video. Try again.');
    } finally {
      setRecording(false);
      setMode('picture');
    }
  }, [capturing, micPermission?.granted, onCapture, recording, requestMicPermission, waitForCameraReady]);

  const stopRecording = useCallback(() => {
    cameraRef.current?.stopRecording();
  }, []);

  const pickFromLibrary = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
      if (!result.canceled) onCapture(result.assets[0].uri, 'photo');
    } catch {
      setCaptureError('Could not open your photo library. Try again.');
    }
  }, [onCapture]);

  // The callbacks below only read cameraRef.current when the gesture actually
  // fires (inside runOnJS), never during render — this mirrors the existing
  // runOnJS(...) gesture idiom in (tabs)/index.tsx's holdAndSlideGesture, just
  // also touching a ref at invocation time.
  /* eslint-disable react-hooks/refs */
  const shutterCombinedGesture = useMemo(
    () =>
      Gesture.Race(
        Gesture.LongPress()
          .minDuration(300)
          .onStart(() => runOnJS(startRecording)())
          .onEnd(() => runOnJS(stopRecording)())
          .onFinalize(() => runOnJS(stopRecording)()),
        Gesture.Tap().onEnd(() => runOnJS(handleCapture)())
      ),
    [handleCapture, startRecording, stopRecording]
  );
  /* eslint-enable react-hooks/refs */

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <ThemedText themeColor="textSecondary" style={styles.permissionText}>
          Allow camera access to take a photo.
        </ThemedText>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <ThemedText type="smallBold">Allow camera</ThemedText>
        </Pressable>
        <Pressable onPress={onCancel} style={styles.permissionButton}>
          <ThemedText type="smallBold">Cancel</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode={mode}
        videoQuality="720p"
        videoBitrate={2_500_000}
        onCameraReady={handleCameraReady}
      />
      <SafeAreaView style={styles.topControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onCancel}
          style={styles.topButton}>
          <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor="#FFFFFF" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip attaching a photo or video"
          onPress={onSkip}
          style={styles.skipButton}>
          <ThemedText style={styles.controlText}>Skip</ThemedText>
        </Pressable>
      </SafeAreaView>
      <SafeAreaView style={styles.controls}>
        <Pressable onPress={pickFromLibrary} style={styles.sideButton}>
          <SymbolView name={{ ios: 'photo.fill', android: 'photo', web: 'photo' }} size={22} tintColor="#FFFFFF" />
        </Pressable>
        <GestureDetector gesture={shutterCombinedGesture}>
          <Pressable
            disabled={capturing}
            style={[
              styles.shutter,
              capturing && styles.shutterDisabled,
              recording && styles.shutterRecording,
            ]}>
            <CountdownRing
              active={recording}
              durationMs={MAX_VIDEO_DURATION_SECONDS * 1000}
              size={SHUTTER_SIZE + 16}
              color="#FFFFFF"
            />
          </Pressable>
        </GestureDetector>
        <Pressable
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          style={styles.sideButton}>
          <SymbolView name={{ ios: 'arrow.triangle.2.circlepath.camera', android: 'flip_camera_android', web: 'flip_camera_android' }} size={22} tintColor="#FFFFFF" />
        </Pressable>
      </SafeAreaView>
      {recording ? (
        <ThemedView style={styles.recordingBadge}>
          <ThemedText style={styles.recordingBadgeText}>● Recording</ThemedText>
        </ThemedView>
      ) : null}
      {captureError ? (
        <ThemedView style={styles.errorBadge}>
          <ThemedText style={styles.errorBadgeText}>{captureError}</ThemedText>
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  topButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  skipButton: { minHeight: 44, minWidth: 60, alignItems: 'center', justifyContent: 'center' },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.four,
  },
  sideButton: { width: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  controlText: { color: '#FFFFFF', fontWeight: '600' },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#FFFFFF66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.5 },
  shutterRecording: {
    backgroundColor: '#F05D4E',
    borderColor: '#FFFFFF',
  },
  recordingBadge: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    backgroundColor: '#00000099',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  recordingBadgeText: { color: '#F05D4E', fontWeight: '700' },
  errorBadge: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    maxWidth: '80%',
    backgroundColor: '#00000099',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  errorBadgeText: { color: '#FFFFFF', textAlign: 'center' },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  permissionText: { textAlign: 'center' },
  permissionButton: { padding: Spacing.two },
});
