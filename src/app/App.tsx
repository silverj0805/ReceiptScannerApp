/**
 * @format
 */

import '../global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'react-native';
import ErrorBoundary from 'react-native-error-boundary';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PrivacyScreenCover from '@/shared/components/privacyScreenCover';
import { recordErrorWithContext } from '@/shared/firebase/crashlyticsRecorder';
import { useCurrentScreenStore } from '@/shared/store/currentScreen';

import RootNavigator from './navigation/RootNavigator';

// KeyboardAwareScrollView(keyboard-controller)가 Reanimated 훅에 불필요한 dependencies를 넘겨 warn이 남.
// 일반 warn이라 error 레벨로만 걸러짐.
configureReanimatedLogger({ level: ReanimatedLogLevel.error });

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
  const currentScreen = useCurrentScreenStore(state => state.currentScreen);

  return (
    <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar
            barStyle={
              currentScreen === 'Scan' ? 'light-content' : 'dark-content'
            }
          />
          <ErrorBoundary onError={handleError}>
            <PrivacyScreenCover>
              <RootNavigator />
            </PrivacyScreenCover>
          </ErrorBoundary>
        </SafeAreaProvider>
      </QueryClientProvider>
    </KeyboardProvider>
  );
}

export default App;
