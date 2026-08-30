import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootSplash from 'react-native-bootsplash';

import { setScreenForTracking } from '@/shared/firebase/crashlyticsRecorder';

import BottomTabNavigator from './BottomTabNavigator';
import StackNavigator from './StackNavigator';
import type { RootStackParamList } from './types';
import { getActiveRouteName } from './utils';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <NavigationContainer
      onReady={() => {
        // react-native-bootsplash 공식 가이드: 네비게이션 트리가 실제로 그려진 뒤에
        // 숨겨야 화면 전환이 스플래시 아래에서 미리 끝나 있는 상태로 보인다.
        BootSplash.hide({ fade: true });
      }}
      onStateChange={state => {
        const screenName = getActiveRouteName(state);
        if (screenName) {
          setScreenForTracking(screenName);
        }
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="BottomTabs" component={BottomTabNavigator} />
        <Stack.Screen name="Stacks" component={StackNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
