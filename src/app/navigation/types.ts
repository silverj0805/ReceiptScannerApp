import type { NavigatorScreenParams } from '@react-navigation/native';

// 탭 네비게이터를 감싸는 루트 스택
export type RootStackParamList = {
  BottomTabs: NavigatorScreenParams<BottomTabParamList>;
  Stacks: NavigatorScreenParams<StackParamList>;
};

// 하단 탭에 귀속된 3개 스크린 — 홈/카메라/내역
export type BottomTabParamList = {
  Home: undefined;
  Scan: undefined;
  ReceiptList: undefined;
};

// 탭 네비게이터 위에 push되는 스택 스크린
export type StackParamList = {
  Confirm: { imageUri: string };
  Detail: { receiptId: string };
};
