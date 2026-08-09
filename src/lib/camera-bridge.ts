// Passes the captured photo URI from the full-screen /camera modal route back
// to whichever screen opened it — router params only carry serializable data,
// but a callback held in-memory works fine since it's the same JS runtime.
let onCapture: ((uri: string) => void) | null = null;

export function setCameraCaptureHandler(handler: (uri: string) => void) {
  onCapture = handler;
}

export function resolveCameraCapture(uri: string) {
  onCapture?.(uri);
  onCapture = null;
}

export function clearCameraCaptureHandler() {
  onCapture = null;
}
