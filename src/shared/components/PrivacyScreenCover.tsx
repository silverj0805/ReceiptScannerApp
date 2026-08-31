import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import Icon from '@/shared/components/ui/Icon';

/**
 * 앱이 백그라운드로 전환되는 순간(OS가 최근 앱 목록/스위처용 스냅샷을 찍는 바로 그 타이밍)
 * 화면 위에 커버를 덮어서 영수증 목록/금액이 그대로 캡처되지 않게 한다.
 *
 * 참고)
 * iOS 전용이다. 안드로이드는 AppState 이벤트가 JS 브릿지를 거쳐 오는 구조라
 * recents 스냅샷이 찍히는 시점을 못 따라가는 게 실측으로 확인됐고(Modal로
 * 바꿔봐도 동일), 순수 네이티브 onPause에서 FLAG_SECURE를 토글하는 방식조차
 * 같은 타이밍 문제로 안 된다는 보고가 있다(facebook/react-native#34157,
 * 결론 없이 방치된 이슈). 안드로이드에서 스크린샷/녹화는 허용하면서 스위처
 * 썸네일만 가리는 공식적인 방법이 없어 현재는 iOS만 적용하고 안드로이드는 보류 상태다.
 */
function PrivacyScreenCover({ children }: PropsWithChildren) {
  const [isCovered, setIsCovered] = useState(
    AppState.currentState !== 'active',
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setIsCovered(nextState !== 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <>
      {children}
      {isCovered && (
        <View
          testID="privacy-screen-cover"
          style={StyleSheet.absoluteFill}
          className="items-center justify-center bg-[#CCE8CD]"
        >
          <Icon
            name="lock-closed-outline"
            size={40}
            colorClassName="accent-primary"
          />
        </View>
      )}
    </>
  );
}

export default PrivacyScreenCover;
