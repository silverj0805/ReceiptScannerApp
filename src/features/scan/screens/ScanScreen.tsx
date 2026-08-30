import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import type { RootStackParamList } from '@/app/navigation/types';
import Icon from '@/shared/components/ui/Icon';

const { width, height } = Dimensions.get('screen');

function ScanScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [flashOn, setFlashOn] = useState(false);

  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();
  // not-determined(마운트 시 자동 요청) / denied·restricted(더 이상 요청 불가, 설정으로 유도) 구분.
  const isPermissionPending = !hasPermission && canRequestPermission;
  const isPermissionDenied = !hasPermission && !canRequestPermission;

  useEffect(() => {
    if (isPermissionPending) {
      requestPermission();
    }
  }, [isPermissionPending, requestPermission]);

  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput();

  const close = () => navigation.goBack();
  const toggleFlash = () => setFlashOn(prev => !prev);
  const goToSettings = () => {
    Linking.openSettings();
  };

  const capture = async () => {
    // TODO(임시): 에뮬레이터는 카메라가 안 돼서 ConfirmScreen 확인용으로 실제 촬영을
    // 우회함. require()로 번들 이미지를 바로 넘기면 (a) 반환값이 string이 아니라 숫자
    // 에셋 ID라 타입이 안 맞고, (b) dev 모드에선 Metro 서버 http:// URL이 돼서 ML Kit의
    // InputImage.fromFilePath()가 못 읽는다 — 그래서 여기선 그냥 없는 파일 경로만 넘기고,
    // ConfirmScreen이 scanText 실패를 "인식 실패" 화면으로 우아하게 처리하는지만 확인.
    // 실제 촬영 로직 복구되면 아래 블록으로 되돌릴 것.
    // const photo = await photoOutput.capturePhoto(
    //   { flashMode: flashOn ? 'on' : 'off' },
    //   {},
    // );
    // const imageUri = await photo.saveToTemporaryFileAsync();
    // photo.dispose();
    navigation.navigate('Stacks', {
      screen: 'Confirm',
      params: { imageUri: 'temp-test-image-uri' },
    });
  };

  const openGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.didCancel) return;

    const imageUri = result.assets?.[0]?.uri;
    if (imageUri == null) return;

    navigation.navigate('Stacks', {
      screen: 'Confirm',
      params: { imageUri },
    });
  };

  if (isPermissionPending) {
    // 시스템 권한 다이얼로그가 뜨는 동안 보여줄 빈 화면.
    return <View className="flex-1 bg-[#141513]" />;
  }

  if (isPermissionDenied) {
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
        {device != null && (
          // Camera는 testID를 지원하지 않아서(CameraViewProps에 없음) View로 한 번 감쌈.
          <View testID="camera-preview" style={StyleSheet.absoluteFill}>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive
              outputs={[photoOutput]}
            />
          </View>
        )}

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
            className="h-18 w-18 items-center justify-center rounded-full border-4 border-white"
          >
            <View className="h-14.5 w-14.5 rounded-full bg-white" />
          </Pressable>
          <View className="h-12 w-12" />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ScanScreen;
