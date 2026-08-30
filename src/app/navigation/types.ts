import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Receipt } from '@/features/receipt/api/types/receipt';

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
  // imageUri: 스캔 플로우(새로 촬영/갤러리 선택)에서만 있음.
  // info: ReceiptDetailScreen의 "수정"에서 넘어올 때만 있음 — 있으면 스캔을 건너뛰고
  // 이 값을 폼 기본값으로 바로 채운, "생성이 아닌 수정" 모드로 동작한다.
  Confirm: { imageUri?: string; info?: Receipt };
  Detail: { receiptId: string };
};
