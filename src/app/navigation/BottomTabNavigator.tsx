import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { CaptureScreen } from '@/features/receipt/screens/CaptureScreen';
import { HomeScreen } from '@/features/receipt/screens/HomeScreen';
import { ReceiptListScreen } from '@/features/receipt/screens/ReceiptListScreen';

import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function BottomTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: '홈' }}
      />
      <Tab.Screen
        name="Capture"
        component={CaptureScreen}
        options={{ title: '카메라' }}
      />
      <Tab.Screen
        name="ReceiptList"
        component={ReceiptListScreen}
        options={{ title: '내역' }}
      />
    </Tab.Navigator>
  );
}
