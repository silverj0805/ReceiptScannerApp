import { useNavigation } from '@react-navigation/native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Linking } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import ScanScreen from './ScanScreen';

// ScanScreen이 navigation prop이 아니라 useNavigation() 훅을 직접 쓰기 때문에
// (HomeScreen과 달리 실제 네비게이터로 감쌀 필요 없이) 훅 자체를 목 처리해서
// navigate/goBack 호출 여부와 인자만 검증한다.
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
}));

// Camera는 네이티브 프리뷰 뷰라서 Jest에서 그릴 수 없어 문자열 host 컴포넌트로 대체.
// usePhotoOutput/useCameraDevice/useCameraPermission도 전부 네이티브 값을 반환하므로 목 처리.
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: jest.fn(),
  useCameraPermission: jest.fn(),
  usePhotoOutput: jest.fn(),
}));

// 갤러리 피커도 네이티브 UI를 띄우므로 목 처리.
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

const mockedUseNavigation = useNavigation as jest.Mock;
const mockedUseCameraPermission = useCameraPermission as jest.Mock;
const mockedUseCameraDevice = useCameraDevice as jest.Mock;
const mockedUsePhotoOutput = usePhotoOutput as jest.Mock;
const mockedLaunchImageLibrary = launchImageLibrary as jest.Mock;

const mockRequestPermission = jest.fn();
const mockCapturePhoto = jest.fn();
const mockSaveToTemporaryFileAsync = jest.fn();
const mockDispose = jest.fn();

// 사진 촬영은 v5의 Output 기반 API: usePhotoOutput()이 만든 photoOutput.capturePhoto()가
// in-memory Photo를 반환하고, saveToTemporaryFileAsync()로 실제 파일 경로를 얻은 뒤
// dispose()로 네이티브 메모리를 해제한다(공식 문서 예제 패턴).
function setPermission(state: {
  hasPermission: boolean;
  canRequestPermission: boolean;
}) {
  mockedUseCameraPermission.mockReturnValue({
    ...state,
    requestPermission: mockRequestPermission,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseNavigation.mockReturnValue({
    navigate: mockNavigate,
    goBack: mockGoBack,
  });
  mockedUseCameraDevice.mockReturnValue({ id: 'back-camera' });
  mockedUsePhotoOutput.mockReturnValue({ capturePhoto: mockCapturePhoto });
  mockCapturePhoto.mockResolvedValue({
    saveToTemporaryFileAsync: mockSaveToTemporaryFileAsync,
    dispose: mockDispose,
  });
  mockSaveToTemporaryFileAsync.mockResolvedValue('file:///tmp/photo.jpg');
  // Linking.openSettings()는 네이티브 모듈 호출이라 Jest에서 그대로 두면 던짐 — 스파이로 대체.
  jest.spyOn(Linking, 'openSettings').mockResolvedValue();
});

test('카메라 권한이 아직 결정되지 않았으면 마운트 시 권한을 요청한다', async () => {
  setPermission({ hasPermission: false, canRequestPermission: true });

  await render(<ScanScreen />);

  await waitFor(() => {
    expect(mockRequestPermission).toHaveBeenCalled();
  });
  // 시스템 다이얼로그 응답 전이라 아직 거부 안내 카드는 뜨지 않아야 함.
  expect(screen.queryByText('카메라 접근 권한이 필요해요')).toBeNull();
});

test('카메라 권한이 거부됐으면 설정으로 이동 안내를 보여준다', async () => {
  setPermission({ hasPermission: false, canRequestPermission: false });

  await render(<ScanScreen />);

  expect(screen.getByText('카메라 접근 권한이 필요해요')).toBeTruthy();
  expect(
    screen.getByText('영수증을 스캔하려면\n카메라 권한을 허용해주세요'),
  ).toBeTruthy();
  expect(screen.getByText('설정으로 이동')).toBeTruthy();
  // canRequestPermission이 false(=denied)면 더 이상 요청해도 소용없으므로 자동 요청은 안 함.
  expect(mockRequestPermission).not.toHaveBeenCalled();
});

test('설정으로 이동 버튼을 누르면 시스템 설정 앱을 연다', async () => {
  setPermission({ hasPermission: false, canRequestPermission: false });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByText('설정으로 이동'));

  expect(Linking.openSettings).toHaveBeenCalled();
});

test('권한 거부 화면에서 나중에 하기를 누르면 이전 화면으로 돌아간다', async () => {
  setPermission({ hasPermission: false, canRequestPermission: false });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByText('나중에 하기'));

  expect(mockGoBack).toHaveBeenCalled();
});

test('카메라 권한이 있으면 카메라 프리뷰를 보여준다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  expect(screen.getByTestId('camera-preview')).toBeTruthy();
});

test('닫기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByTestId('scan-close-button'));

  expect(mockGoBack).toHaveBeenCalled();
});

test('촬영 버튼을 누르면 확인 화면으로 이동한다', async () => {
  // TODO: ScanScreen.tsx의 capture()가 에뮬레이터 카메라 미지원 때문에
  // capturePhoto/saveToTemporaryFileAsync/dispose 호출을 우회하고 고정 테스트
  // imageUri로 바로 Confirm으로 넘어가게 돼있음(주석 참고). 실제 촬영 로직이
  // 복구되면 이 테스트도 capturePhoto 등 호출을 검증하는 형태로 되돌릴 것.
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByTestId('scan-capture-button'));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('Stacks', {
      screen: 'Confirm',
      params: { imageUri: 'temp-test-image-uri' },
    });
  });
  expect(mockCapturePhoto).not.toHaveBeenCalled();
});

test('갤러리에서 사진을 선택하면 확인 화면으로 이동한다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });
  mockedLaunchImageLibrary.mockResolvedValue({
    didCancel: false,
    assets: [{ uri: 'file:///tmp/gallery.jpg' }],
  });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByTestId('scan-gallery-button'));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('Stacks', {
      screen: 'Confirm',
      params: { imageUri: 'file:///tmp/gallery.jpg' },
    });
  });
});

test('갤러리 선택을 취소하면 화면 이동이 일어나지 않는다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });
  mockedLaunchImageLibrary.mockResolvedValue({ didCancel: true });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByTestId('scan-gallery-button'));

  await waitFor(() => {
    expect(mockedLaunchImageLibrary).toHaveBeenCalled();
  });
  expect(mockNavigate).not.toHaveBeenCalled();
});
