import { router } from 'expo-router';

import { InAppCamera } from '@/components/in-app-camera';
import { setPendingMedia } from '@/lib/pending-media';

export default function CameraModal() {
  return (
    <InAppCamera
      onCapture={(uri, kind) => {
        setPendingMedia({ uri, kind });
        router.replace('/send-sheet');
      }}
      onSkip={() => {
        setPendingMedia(null);
        router.replace('/send-sheet');
      }}
      onCancel={() => {
        router.back();
      }}
    />
  );
}
