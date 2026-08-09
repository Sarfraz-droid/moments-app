import { router } from 'expo-router';

import { InAppCamera } from '@/components/in-app-camera';
import { clearCameraCaptureHandler, resolveCameraCapture } from '@/lib/camera-bridge';

export default function CameraModal() {
  return (
    <InAppCamera
      onCapture={(uri) => {
        resolveCameraCapture(uri);
        router.back();
      }}
      onCancel={() => {
        clearCameraCaptureHandler();
        router.back();
      }}
    />
  );
}
