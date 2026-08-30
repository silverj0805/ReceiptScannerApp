import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';

import type { RootStackParamList } from '@/app/navigation/types';

// "기록" 탭은 실제 탭 콘텐츠가 없음 — 스캔 없이 바로 영수증을 직접 입력하고 싶은
// 유저를 위해, 탭을 누르면 Write 탭으로 전환되는 대신 곧장 Stacks/Confirm으로
// 이동시킨다(props.onPress를 그대로 두면 기본 탭 전환이 되므로, 덮어써서 막는다).
function WriteTabButton(props: BottomTabBarButtonProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      {...props}
      onPress={() => {
        navigation.navigate('Stacks', { screen: 'Confirm', params: {} });
      }}
    />
  );
}

export default WriteTabButton;
