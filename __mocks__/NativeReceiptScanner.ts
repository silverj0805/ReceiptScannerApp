// scanText 네이티브 모듈(TurboModule)은 Jest(Node 환경, 실제 네이티브 바이너리 없음)에서
// import 시점에 TurboModuleRegistry.getEnforcing()이 곧바로 던지기 때문에, 테스트에서는
// 이 목(mock)으로 대체한다. jest.config.js의 moduleNameMapper가 실제 경로 대신 이 파일을
// 쓰도록 연결한다.
export default {
  multiply: jest.fn((a: number, b: number) => a * b),
  scanText: jest.fn(() => Promise.resolve('')),
};
