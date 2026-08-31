// react-native-fs는 네이티브 모듈(NativeModules.RNFSManager)을 직접 참조해서
// Jest 환경에선 import만 해도 "Native module RNFSManager is not available" 에러가
// 남 — 실제 쓰는 함수만 목으로 대체.
export default {
  unlink: jest.fn(() => Promise.resolve()),
};
