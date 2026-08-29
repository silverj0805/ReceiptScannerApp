import {
  NavigationContainer,
  type NavigationState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ConfirmScreen } from '@/features/receipt/screens/ConfirmScreen';
import { ReceiptDetailScreen } from '@/features/receipt/screens/ReceiptDetailScreen';
import { setScreenForTracking } from '@/shared/firebase/crashlyticsRecorder';

import { BottomTabNavigator } from './BottomTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// 중첩 네비게이터(RootStack 안의 BottomTab 등)를 타고 내려가 실제 활성 화면
// 이름을 뽑아냄 — 탭 안에 있을 땐 state.routes[index]가 다시 하위 네비게이터의
// state를 갖고 있어서 재귀적으로 내려가야 함.
function getActiveRouteName(
  state: NavigationState | undefined,
): string | null {
  if (!state) return null;

  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}

export function RootNavigator() {
  return (
    <NavigationContainer
      onStateChange={state => {
        const screenName = getActiveRouteName(state);
        if (screenName) {
          setScreenForTracking(screenName);
        }
      }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Detail" component={ReceiptDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
