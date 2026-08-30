/**
 * @format
 */

import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar, useColorScheme } from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { recordErrorWithContext } from '@/shared/firebase/crashlyticsRecorder';
import { useCurrentScreenStore } from '@/shared/store/currentScreen';

import RootNavigator from './navigation/RootNavigator';

// react-native-keyboard-controller의 KeyboardAwareScrollView가 내부적으로 Reanimated
// 훅(useAnimatedReaction/useDerivedValue/useAnimatedStyle)에 불필요한 dependencies
// 배열을 넘겨서(라이브러리 자체 코드, 우리 쪽에서 고칠 수 없음) "dependencies should
// only be used in web implementation" warn이 계속 뜸 — strict 마킹 없는 일반 warn이라
// level을 error로 올려야만 걸러짐(strict:false로는 안 걸러짐, 소스 확인함).
configureReanimatedLogger({ level: ReanimatedLogLevel.error });

// 렌더링 중 잡히지 않은 에러(ErrorBoundary가 잡는 것)도 화면 컨텍스트와 함께
// Crashlytics에 기록되도록 연결. UI는 라이브러리 기본 FallbackComponent 사용.
function handleError(error: Error, stackTrace: string) {
  if (__DEV__) {
    console.error('⚠️ ErrorBoundary caught an error:', error, stackTrace);
  }
  recordErrorWithContext(error, {
    extra: { stackTrace: stackTrace.slice(0, 500) },
  }).catch(() => {});
}

const queryClient = new QueryClient();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const currentScreen = useCurrentScreenStore(state => state.currentScreen);

  return (
    <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar
            barStyle={
              isDarkMode || currentScreen === 'Scan'
                ? 'light-content'
                : 'dark-content'
            }
          />
          <ErrorBoundary onError={handleError}>
            <RootNavigator />
          </ErrorBoundary>
        </SafeAreaProvider>
      </QueryClientProvider>
    </KeyboardProvider>
  );
}

export default App;
