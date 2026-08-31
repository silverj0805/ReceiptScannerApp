import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Receipt } from '@/features/receipt/api/types/receipt';

export type RootStackParamList = {
  BottomTabs: NavigatorScreenParams<BottomTabParamList>;
  Stacks: NavigatorScreenParams<StackParamList>;
};

export type BottomTabParamList = {
  Home: undefined;
  Write: undefined;
  Scan: undefined;
  ReceiptList: undefined;
  Settings: undefined;
};

export type StackParamList = {
  Confirm: { imageUri?: string; info?: Receipt };
  Detail: { receiptId: string };
  Settings: undefined;
  License: undefined;
  WebView: { url: string; title: string };
};
