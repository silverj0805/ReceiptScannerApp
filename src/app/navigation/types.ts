import type { NavigatorScreenParams } from '@react-navigation/native';

// 하단 탭에 귀속된 3개 스크린 — 홈/카메라/내역
export type BottomTabParamList = {
  Home: undefined;
  Capture: undefined;
  ReceiptList: undefined;
};

// 탭 네비게이터를 감싸는 루트 스택 — Confirm/Detail은 탭 바 없이 풀스크린으로 그 위에 push되는 스택 스크린
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  Confirm: { imageUri: string };
  Detail: { receiptId: string };
};
