/**
 * @format
 */

import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar, useColorScheme } from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { recordErrorWithContext } from '@/shared/firebase/crashlyticsRecorder';

import RootNavigator from './navigation/RootNavigator';

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

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ErrorBoundary onError={handleError}>
          <RootNavigator />
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
