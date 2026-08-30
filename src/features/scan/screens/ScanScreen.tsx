import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Dimensions, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@/app/navigation/types';
import Icon from '@/shared/components/ui/Icon';

const { width, height } = Dimensions.get('screen');

// TODO(패키지 연동): 지금은 UI만 먼저 완성하는 단계라 권한 상태를 로컬 state로만 흉내냄.
// 다음 단계에서 react-native-vision-camera의 useCameraPermission()으로 교체.
const TEMP_HAS_PERMISSION = true;

function ScanScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [flashOn, setFlashOn] = useState(false);

  const close = () => navigation.goBack();
  const toggleFlash = () => setFlashOn(prev => !prev);
  // TODO(패키지 연동): Linking.openSettings()로 교체.
  const goToSettings = () => {};
  // TODO(패키지 연동): react-native-vision-camera의 photoOutput.capturePhoto()로 교체.
  const capture = () => {};
  // TODO(패키지 연동): react-native-image-picker의 launchImageLibrary()로 교체.
  const openGallery = () => {};

  if (!TEMP_HAS_PERMISSION) {
    return (
      <View className="flex-1 items-center justify-center gap-4.5 bg-[#141513] px-8">
        <Icon name="camera-outline" size={72} colorClassName="accent-primary" />
        <View className="items-center gap-2">
          <Text className="text-[17px] font-extrabold text-white">
            카메라 접근 권한이 필요해요
          </Text>
          <Text className="text-center text-[13px] leading-5 text-[#a8a6a1]">
            영수증을 스캔하려면{'\n'}카메라 권한을 허용해주세요
          </Text>
        </View>
        <View className="items-center gap-2.5">
          <Pressable
            onPress={goToSettings}
            className="rounded-2xl bg-primary px-7 py-3.5"
          >
            <Text className="text-sm font-bold text-white">설정으로 이동</Text>
          </Pressable>
          <Pressable onPress={close} hitSlop={8}>
            <Text className="text-[13px] font-semibold text-[#a8a6a1]">
              나중에 하기
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: '#141513' }}
    >
      <StatusBar barStyle="light-content" />
      <View className="flex-1 bg-[#141513]">
        {/* 카메라 프리뷰 자리 — 패키지 연동 단계에서 <Camera/>로 교체 예정 */}
        <View testID="camera-preview" className="absolute inset-0" />

        <View pointerEvents="box-none" className="absolute inset-x-0 top-0">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between p-5">
            <Pressable
              testID="scan-close-button"
              onPress={close}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.14)]"
            >
              <Icon
                name="chevron-back"
                size={20}
                colorClassName="accent-white"
              />
            </Pressable>
            <Text className="text-sm font-bold text-white">영수증 스캔</Text>
            <Pressable
              onPress={toggleFlash}
              hitSlop={8}
              className={
                flashOn
                  ? 'h-9 w-9 items-center justify-center rounded-full bg-[#f4c453]'
                  : 'h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.14)]'
              }
            >
              <Icon
                name={flashOn ? 'flash' : 'flash-outline'}
                size={18}
                colorClassName={flashOn ? 'accent-[#f4c453]' : 'accent-white'}
              />
            </Pressable>
          </View>

          {/* 프레임 가이드 + 안내 문구  */}
          <View pointerEvents="none" className="mt-5 items-center gap-3">
            <View className="rounded-full bg-[rgba(0,0,0,0.45)] px-4 py-2">
              <Text className="text-xs font-semibold text-white">
                영수증을 프레임 안에 맞춰주세요
              </Text>
            </View>
            <View
              className="rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.55)]"
              style={{ width: width * 0.88, height: height * 0.55 }}
            />
          </View>
        </View>

        {/* 하단 컨트롤 */}
        <View className="absolute inset-x-0 bottom-0 flex-row items-center justify-between px-7 pb-10 pt-5">
          <Pressable
            testID="scan-gallery-button"
            onPress={openGallery}
            hitSlop={8}
            className="h-12 w-12 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.14)]"
          >
            <Icon
              name="image-outline"
              size={20}
              colorClassName="accent-white"
            />
          </Pressable>
          <Pressable
            testID="scan-capture-button"
            onPress={capture}
            hitSlop={8}
            className="h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white"
          >
            <View className="h-[58px] w-[58px] rounded-full bg-white" />
          </Pressable>
          <View className="h-12 w-12" />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ScanScreen;
