import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable, View } from 'react-native';

import Icon from '@/shared/components/Icon';

function ScanTabButton(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      className="-top-8 items-center justify-center"
      style={({ pressed }) => [props.style, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_10px_22px_rgba(27,94,67,0.38)]">
        <Icon name="camera-outline" size={24} colorClassName="accent-white" />
      </View>
    </Pressable>
  );
}

export default ScanTabButton;
