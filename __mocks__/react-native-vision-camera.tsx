// react-native-vision-camera는 내부적으로 react-native-nitro-modules의 실제
// TurboModule을 로드하는데, Jest(실제 네이티브 바이너리 없음)에서는 그냥 import만 해도
// "NitroModules could not be found" invariant violation을 던진다.
// node_modules 패키지용 수동 목(manual mock)이라 __mocks__/react-native-vision-camera.*
// 파일만 있으면 Jest가 명시적 jest.mock() 없이도 자동으로 이 파일을 대신 사용함
// (ScanScreen.test.tsx처럼 세부 동작을 검증해야 하는 곳은 그 파일 안에서 이 값들을
// jest.mock()으로 다시 오버라이드해서 씀 — 이 파일은 App.test.tsx처럼 vision-camera를
// 직접 검증하지 않는 다른 테스트에서 import 트리가 안 깨지게만 해주는 fallback).
export const Camera = () => null;
export const useCameraDevice = jest.fn(() => undefined);
export const useCameraPermission = jest.fn(() => ({
  status: 'not-determined',
  hasPermission: false,
  canRequestPermission: true,
  requestPermission: jest.fn(async () => false),
}));
export const usePhotoOutput = jest.fn(() => ({
  capturePhoto: jest.fn(async () => ({
    saveToTemporaryFileAsync: jest.fn(async () => ''),
    dispose: jest.fn(),
  })),
}));
