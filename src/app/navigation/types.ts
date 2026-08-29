import type { NavigatorScreenParams } from '@react-navigation/native';

// 하단 탭에 귀속된 3개 스크린 — 홈/카메라/내역.
// 가운데 "카메라" 탭은 라운드 버튼으로 보이지만, 뒤로가기/탭 상태가 정상 동작하도록
// 실제로는 이 3개 다 진짜 탭 스크린으로 등록한다(디자인은 추후 탭 UI 고도화 태스크에서).
export type MainTabParamList = {
  Home: undefined;
  Capture: undefined;
  ReceiptList: undefined;
};

// 탭 네비게이터를 감싸는 루트 스택 — Confirm/Detail은 탭 바 없이 풀스크린으로
// 그 위에 push되는 스택 스크린이다.
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Confirm: { imageUri: string };
  Detail: { receiptId: string };
};
