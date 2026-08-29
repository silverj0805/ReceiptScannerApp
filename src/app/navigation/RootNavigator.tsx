import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConfirmScreen } from '@/features/receipt/screens/ConfirmScreen';
import { ReceiptDetailScreen } from '@/features/receipt/screens/ReceiptDetailScreen';
import { MainTabNavigator } from './MainTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// 탭 네비게이터(MainTabs)를 루트 스택으로 감싸서, Confirm/Detail은 탭 바 없이
// 풀스크린으로 그 위에 push되게 한다.
export function RootNavigator() {
  return (
    <NavigationContainer>
      {/* 지금은 모든 화면 헤더를 끔 — 실제 헤더(뒤로가기 버튼, 타이틀 등)는 각 화면을
          본격적으로 만드는 태스크에서 필요에 맞게 커스텀으로 다시 넣을 예정. */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Detail" component={ReceiptDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
