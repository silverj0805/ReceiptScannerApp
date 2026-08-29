module.exports = {
  preset: '@react-native/jest-preset',
  // @react-native/jest-preset의 기본 transformIgnorePatterns는 react-native 계열만
  // 커버해서, ESM으로 배포되는 @react-navigation 패키지들은 여기 추가해야
  // Babel 트랜스폼 대상에 포함됨(공식 react-navigation 이슈 트래커의 권장 패턴).
  // msw는 최신 문법(ESM)으로 배포되고, 의존성들(rettime, @mswjs/*, @open-draft/*,
  // @bundled-es-modules/*, headers-polyfill, strict-event-emitter, outvariant, until-async)도
  // 트랜스파일이 안 된 상태라 여기 다 추가해야 함(공식 커뮤니티 가이드에서도 안내하는 목록).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-firebase|@react-navigation|react-native-safe-area-context|react-native-error-boundary|msw|rettime|@mswjs|@open-draft|@bundled-es-modules|headers-polyfill|strict-event-emitter|outvariant|until-async)/)',
  ],
  // rettime(msw의 의존성)이 .mjs 확장자로 배포되는데, 기본 transform 패턴이
  // js/ts/tsx만 잡고 mjs를 빼먹어서 transformIgnorePatterns를 뚫어놔도 애초에
  // 변환 대상에서 제외됐었음(mswjs/msw#2698에서 확인한 원인) — mjs 추가.
  transform: {
    '^.+\\.(js|mjs|ts|tsx)$': 'babel-jest',
  },
  // react-native-safe-area-context 공식 목(mock) 등록 — jest.mock() 호출이라 setupFiles가
  // 아니라 setupFilesAfterEnv(jest 전역이 준비된 시점)에서 실행돼야 함.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // scanText TurboModule은 Jest 환경(실제 네이티브 바이너리 없음)에서 import만 해도
  // TurboModuleRegistry.getEnforcing()이 던지므로, 어디서 상대경로로 import하든
  // 항상 목(mock)으로 대체되도록 경로 끝부분만 매칭.
  moduleNameMapper: {
    'specs/NativeReceiptScanner$': '<rootDir>/__mocks__/NativeReceiptScanner.ts',
    // Jest는 Metro의 CSS 파이프라인(uniwind)을 거치지 않으므로, .css import는 빈 모듈로 목 처리.
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
  // @react-native/jest-preset의 테스트 환경(react-native-env.js)이
  // customExportConditions를 ['require', 'react-native']로 통째로 덮어써서 기본값인
  // 'node'가 빠져 있음 — msw의 package.json exports는 "node" 조건에서만 msw/node를
  // 정상 제공하므로 다시 추가. 'msw'는 mswjs/msw#2698에서 확인한, msw 자체가 Jest
  // 환경을 식별하기 위해 쓰는 전용 조건.
  testEnvironmentOptions: {
    customExportConditions: ['require', 'node', 'react-native', 'msw'],
  },
};
