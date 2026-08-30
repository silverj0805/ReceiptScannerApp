import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { getVersion } from 'react-native-device-info';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { StackParamList } from '@/app/navigation/types';
import Icon from '@/shared/components/ui/Icon';

function SettingsScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<StackParamList>;
}) {
  const goBack = () => navigation.goBack();
  const goToLicense = () => navigation.navigate('License');

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1 }}
      className="bg-background"
    >
      <View className="flex-row items-center justify-between p-5">
        <Pressable testID="settings-back-button" onPress={goBack} hitSlop={8}>
          <Icon name="chevron-back" size={22} colorClassName="accent-black" />
        </Pressable>
        <Text className="text-[15px] font-bold text-black">설정</Text>
        <View className="w-5.5" />
      </View>

      <ScrollView contentContainerClassName="px-5">
        <Pressable
          testID="settings-license-row"
          onPress={goToLicense}
          className="flex-row items-center justify-between border-b border-[#e8e6e1] py-4"
        >
          <Text className="text-sm font-semibold text-black">
            오픈소스 라이센스
          </Text>
          <Icon name="chevron-forward" size={18} colorClassName="accent-gray" />
        </Pressable>

        <View className="flex-row items-center justify-between py-4">
          <Text className="text-sm font-semibold text-gray">앱 버전</Text>
          <Text testID="settings-app-version" className="text-sm text-gray">
            {getVersion()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SettingsScreen;
