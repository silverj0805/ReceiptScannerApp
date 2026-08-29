module.exports = {
  preset: '@react-native/jest-preset',
  // @react-native/jest-preset의 기본 transformIgnorePatterns는 react-native 계열만
  // 커버해서, ESM으로 배포되는 @react-navigation 패키지들은 여기 추가해야
  // Babel 트랜스폼 대상에 포함됨(공식 react-navigation 이슈 트래커의 권장 패턴).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation)/)',
  ],
  // scanText TurboModule은 Jest 환경(실제 네이티브 바이너리 없음)에서 import만 해도
  // TurboModuleRegistry.getEnforcing()이 던지므로, 어디서 상대경로로 import하든
  // 항상 목(mock)으로 대체되도록 경로 끝부분만 매칭.
  moduleNameMapper: {
    'specs/NativeReceiptScanner$': '<rootDir>/__mocks__/NativeReceiptScanner.ts',
  },
};
