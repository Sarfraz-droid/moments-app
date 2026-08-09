import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Props = {
  onCapture: (uri: string) => void;
  onCancel: () => void;
};

// Renders the camera preview inline instead of launching the OS camera app
// (ImagePicker.launchCameraAsync) — leaving the app for an external Activity
// risks Android reclaiming/recreating ours in the background, which wipes
// in-progress state (photo, note draft, navigation). Staying in-process avoids that.
export function InAppCamera({ onCapture, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <ThemedView style={styles.permissionContainer}>
        <ThemedText themeColor="textSecondary" style={styles.permissionText}>
          Camera access chahiye photo lene ke liye.
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

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) onCapture(photo.uri);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      <SafeAreaView style={styles.controls}>
        <Pressable onPress={onCancel} style={styles.sideButton}>
          <ThemedText style={styles.controlText}>Cancel</ThemedText>
        </Pressable>
        <Pressable
          onPress={handleCapture}
          disabled={capturing}
          style={[styles.shutter, capturing && styles.shutterDisabled]}
        />
        <Pressable
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          style={styles.sideButton}>
          <ThemedText style={styles.controlText}>Flip</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
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
  sideButton: { padding: Spacing.two },
  controlText: { color: '#FFFFFF' },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#00000055',
  },
  shutterDisabled: { opacity: 0.5 },
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
