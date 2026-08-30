// 공식 react-native-reanimated/mock은 내부적으로 실제 네이티브 worklet 엔진 일부를
// 재사용하는 하이브리드 구조라, Jest(v4 + react-native-worklets 분리 이후)에서
// "createShareable is not supported on web" 등으로 초기화 자체가 깨진다
// (software-mansion/react-native-reanimated#7718, 이 글 작성 시점 미해결).
// 이 프로젝트는 App.tsx에서 configureReanimatedLogger()만 직접 쓰고, 실제 애니메이션
// 훅들은 react-native-keyboard-controller 내부에서만 쓰이는데 그 라이브러리의 공식
// jest mock(react-native-keyboard-controller/jest)은 reanimated를 아예 import하지
// 않으므로, 여기서는 App.tsx가 실제로 쓰는 것만 최소한으로 제공하면 충분하다.
export const configureReanimatedLogger = jest.fn();
export const ReanimatedLogLevel = {
  warn: 1,
  error: 2,
} as const;
