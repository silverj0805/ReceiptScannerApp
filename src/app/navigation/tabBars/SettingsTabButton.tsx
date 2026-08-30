import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';

import type { RootStackParamList } from '@/app/navigation/types';

// "설정" 탭도 실제 탭 콘텐츠가 없음(WriteTabButton과 동일한 이유) — 탭을 누르면
// Settings 탭으로 전환되는 대신 곧장 Stacks/Settings로 이동시킨다.
function SettingsTabButton(props: BottomTabBarButtonProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      {...props}
      onPress={() => {
        navigation.navigate('Stacks', { screen: 'Settings' });
      }}
    />
  );
}

export default SettingsTabButton;
