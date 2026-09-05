import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  usePhotoOutput,
} from 'react-native-vision-camera';

import type { RootStackParamList } from '@/app/navigation/types';

import CaptureButton from '../components/CaptureButton';
import GalleryButton from '../components/GalleryButton';
import PermissionDeniedBlocker from '../components/PermissionDeniedBlocker';
import ScanHeader from '../components/ScanHeader';
import ScanHelperText from '../components/ScanHelperText';
import ScanLoader from '../components/ScanLoader';
import usePermission from '../hooks/usePermission';

function ScanScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const { isPermissionPending, isPermissionDenied } = usePermission();

  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.UHD_4_3,
    qualityPrioritization: 'quality',
  });

  const close = () => navigation.goBack();
  const goToSettings = () => Linking.openSettings();

  const capture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    try {
      const photo = await photoOutput.capturePhoto({ flashMode: 'off' }, {});
      const path = await photo.saveToTemporaryFileAsync();
      photo.dispose();

      /**
       * react-native-vision-camera는 스킴 없는 순수 파일 경로를 반환한다
       * (예: /data/user/0/com.silverj0805.receiptscannerapp/cache/VisionCamera_xxx.jpg)
       * 네이티브 OCR 모듈은 Uri.parse(Kotlin)/URL(string:)(Swift)
       * 둘 다 file:// 스킴이 있어야 실제 파일을 열 수 있어서, 없으면 이 시점에 붙여준다
       * — 안 붙이면 scanText가 파일을 못 찾고 조용히 reject되어 "인식 실패" 화면으로 빠진다.
       */
      const imageUri = path.startsWith('file://') ? path : `file://${path}`;

      navigation.navigate('Stacks', {
        screen: 'Confirm',
        params: { imageUri },
      });
    } catch {
    } finally {
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
      <PermissionDeniedBlocker goToSettings={goToSettings} close={close} />
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: '#141513' }}
    >
      <View className="flex-1 bg-[#141513]">
        {device != null && (
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
        {!isCameraReady && <ScanLoader />}

        <View pointerEvents="box-none" className="absolute inset-x-0 top-0">
          {/* 헤더 */}
          <ScanHeader close={close} />
          <ScanHelperText />
        </View>

        {/* 하단 컨트롤 */}
        <View className="absolute inset-x-0 bottom-0 flex-row items-center justify-between bg-black px-7 pt-5 pb-10">
          <GalleryButton openGallery={openGallery} />
          <CaptureButton capture={capture} isCapturing={isCapturing} />
          <View className="h-12 w-12" />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ScanScreen;
