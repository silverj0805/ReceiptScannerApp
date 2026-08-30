// 실제 패키지는 네이티브 모듈(TurboModuleRegistry)에 의존해서 Jest 환경에서 그대로
// import하면 죽는다(다른 네이티브 라이브러리들과 동일한 이유) — 최소한의 수동 목만 제공.
// onLoadStart/onLoadEnd/onError를 그대로 View에 넘겨서, 테스트에서
// fireEvent(getByTestId('webview'), 'loadEnd') 식으로 직접 호출할 수 있게 한다.
import React from 'react';
import { View } from 'react-native';

interface MockWebViewProps {
  testID?: string;
  source: { uri: string };
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

export function WebView({ testID, source, ...handlers }: MockWebViewProps) {
  return <View testID={testID} accessibilityLabel={source.uri} {...handlers} />;
}

export default WebView;
