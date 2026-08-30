import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import type { RootStackParamList } from '@/app/navigation/types';
import Icon from '@/shared/components/ui/Icon';

function ScanScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [flashOn, setFlashOn] = useState(false);
  // Camera가 마운트돼도 실제로 첫 프레임을 그리기 전까진 검정 화면만 보여서
  // 준비 중임을 알 수 있는 스피너를 따로 보여준다. onError가 나도 무한 스피너로
  // 안 남게 준비 완료로 취급한다(검정 화면이 낫지, 영원히 도는 스피너보단).
  const [isCameraReady, setIsCameraReady] = useState(false);
  // 촬영 버튼 연타로 capturePhoto()가 중복 호출되는 걸 막는 방어 코드.
  const [isCapturing, setIsCapturing] = useState(false);

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
  // 영수증은 글씨가 작고 촘촘해서 기본 해상도/화질로는 OCR이 특히 상호명처럼
  // 작은 텍스트에서 잘못된 글자를 읽는 경우가 실기기 테스트에서 확인됨 —
  // 4:3 고해상도 타겟 + 'quality' 프라이오리티(캡처 속도보다 노출/화질 우선)로 올림.
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.UHD_4_3,
    qualityPrioritization: 'quality',
  });

  const close = () => navigation.goBack();
  const toggleFlash = () => setFlashOn(prev => !prev);
  const goToSettings = () => {
    Linking.openSettings();
  };

  const capture = async () => {
    // capturePhoto()가 끝나기 전에 다시 눌려도(연타) 중복으로 찍히지 않게 막는다.
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await photoOutput.capturePhoto(
        { flashMode: flashOn ? 'on' : 'off' },
        {},
      );
      const path = await photo.saveToTemporaryFileAsync();
      photo.dispose();
      // react-native-vision-camera는 스킴 없는 순수 파일 경로를 반환한다
      // (예: /data/user/0/com.silverj0805.receiptscannerapp/cache/VisionCamera_xxx.jpg).
      // 네이티브 OCR 모듈은 Uri.parse(Kotlin)/URL(string:)(Swift) 둘 다 file:// 스킴이
      // 있어야 실제 파일을 열 수 있어서, 없으면 이 시점에 붙여준다 — 안 붙이면
      // scanText가 파일을 못 찾고 조용히 reject되어 "인식 실패" 화면으로 빠진다.
      const imageUri = path.startsWith('file://') ? path : `file://${path}`;
      navigation.navigate('Stacks', {
        screen: 'Confirm',
        params: { imageUri },
      });
    } catch {
      // 촬영 자체가 실패하는 경우(드묾) 조용히 무시 — catch 없이 두면 onPress가
      // 반환하는 프라미스를 아무도 안 받아서 unhandled rejection으로 새어나간다
      // (ConfirmScreen의 scanText가 같은 이유로 .catch()를 두는 것과 동일).
      // 버튼은 finally에서 풀리니 사용자가 다시 시도하면 됨.
    } finally {
      // 성공하면 다음 화면으로 넘어가니 굳이 안 풀어도 되지만, 촬영 자체가 실패한
      // 경우엔 다시 찍을 수 있어야 하므로 항상 풀어준다.
      setIsCapturing(false);
    }
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
      <View className="flex-1 bg-[#141513]">
        {device != null && (
          // Camera는 testID를 지원하지 않아서(CameraViewProps에 없음) View로 한 번 감쌈.
          <View testID="camera-preview" style={StyleSheet.absoluteFill}>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive
              outputs={[photoOutput]}
              onPreviewStarted={() => setIsCameraReady(true)}
              onError={() => setIsCameraReady(true)}
            />
          </View>
        )}

        {/* device가 아직 없거나(useCameraDevice 해석 전), Camera는 마운트됐지만
            아직 첫 프레임을 못 그린 동안(onPreviewStarted 전) 검정 화면만 보이는 걸 막음. */}
        {!isCameraReady && (
          <View
            testID="camera-loading"
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            className="items-center justify-center bg-[#141513]"
          >
            <ActivityIndicator color="#ffffff" />
          </View>
        )}

        <View pointerEvents="box-none" className="absolute inset-x-0 top-0">
          {/* 헤더 */}
          <View className="flex-row items-center justify-between p-5 bg-black">
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
            <View className="h-9 w-9" />
            {/* <Pressable
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
            </Pressable> */}
          </View>

          {/* 인식률 안내 문구 */}
          <View pointerEvents="none" className="mt-3 items-center px-5">
            <View className="flex-row items-center gap-1.5 rounded-full bg-[rgba(0,0,0,0.45)] px-4 py-2">
              <Icon
                name="information-circle-outline"
                size={14}
                colorClassName="accent-white"
              />
              <Text className="flex-1 text-xs font-semibold text-white">
                인식률을 높이기 위해 선명한 화질로 필요한 정보만 가까이서
                찍어주세요
              </Text>
            </View>
          </View>

          {/* 프레임 가이드 + 안내 문구  */}
          {/* <View pointerEvents="none" className="mt-5 items-center gap-3">
            <View className="rounded-full bg-[rgba(0,0,0,0.45)] px-4 py-2">
              <Text className="text-xs font-semibold text-white">
                영수증을 프레임 안에 맞춰주세요
              </Text>
            </View>
            <View
              className="rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.55)]"
              style={{ width: width * 0.88, height: height * 0.55 }}
            />
          </View> */}
        </View>

        {/* 하단 컨트롤 */}
        <View className="absolute inset-x-0 bottom-0 flex-row items-center justify-between px-7 pb-10 pt-5 bg-black">
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
            disabled={isCapturing}
            hitSlop={8}
            className={`h-18 w-18 items-center justify-center rounded-full border-4 border-white ${
              isCapturing ? 'opacity-40' : ''
            }`}
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
