import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';

import type { RootStackParamList } from '@/app/navigation/types';

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
