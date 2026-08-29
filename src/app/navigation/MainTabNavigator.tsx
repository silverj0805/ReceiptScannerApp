import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CaptureScreen } from '@/features/receipt/screens/CaptureScreen';
import { HomeScreen } from '@/features/receipt/screens/HomeScreen';
import { ReceiptListScreen } from '@/features/receipt/screens/ReceiptListScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// 지금은 스크린 연결만 — 가운데 "카메라" 탭을 라벨 없는 raised 원형 버튼으로
// 렌더링하는 커스텀 tabBarButton/아이콘 스타일링은 하단 탭 UI 고도화 태스크에서 채움.
// 헤더도 전부 꺼둠(디자인엔 탭 화면 상단에 별도 헤더 바가 없음) — title은 탭 바
// 라벨(tabBarLabel의 기본값)로 계속 쓰이므로 남겨둠.
export function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Capture" component={CaptureScreen} options={{ title: '카메라' }} />
      <Tab.Screen name="ReceiptList" component={ReceiptListScreen} options={{ title: '내역' }} />
    </Tab.Navigator>
  );
}
