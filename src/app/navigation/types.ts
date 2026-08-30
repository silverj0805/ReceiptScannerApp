import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Receipt } from '@/features/receipt/api/types/receipt';

// 탭 네비게이터를 감싸는 루트 스택
export type RootStackParamList = {
  BottomTabs: NavigatorScreenParams<BottomTabParamList>;
  Stacks: NavigatorScreenParams<StackParamList>;
};

// 하단 탭에 귀속된 5개 스크린 — 홈/기록/카메라/내역/설정.
// Write·Settings는 실제 화면이 아니라 탭바 버튼 프레스를 가로채서 Stacks의 화면으로
// 바로 보내는 용도라 화면 자체는 없음(WriteTabButton/SettingsTabButton, TabRedirectScreen 참고).
export type BottomTabParamList = {
  Home: undefined;
  Write: undefined;
  Scan: undefined;
  ReceiptList: undefined;
  Settings: undefined;
};

// 탭 네비게이터 위에 push되는 스택 스크린
export type StackParamList = {
  // imageUri: 스캔 플로우(새로 촬영/갤러리 선택)에서만 있음.
  // info: ReceiptDetailScreen의 "수정"에서 넘어올 때만 있음 — 있으면 스캔을 건너뛰고
  // 이 값을 폼 기본값으로 바로 채운, "생성이 아닌 수정" 모드로 동작한다.
  Confirm: { imageUri?: string; info?: Receipt };
  Detail: { receiptId: string };
  Settings: undefined;
  License: undefined;
  // 개인정보처리방침/이용약관처럼 외부(노션 등)에 발행된 페이지를 보여줄 때 재사용하는
  // 범용 WebView 화면. url이 빈 문자열이면 "준비 중" 안내를 보여준다.
  WebView: { url: string; title: string };
};
