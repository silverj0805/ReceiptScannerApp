import { useNavigation } from '@react-navigation/native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
});

test('카메라 권한이 아직 결정되지 않았으면 마운트 시 권한을 요청한다', async () => {
  setPermission({ hasPermission: false, canRequestPermission: true });

  await render(<ScanScreen />);

  await waitFor(() => {
    expect(mockRequestPermission).toHaveBeenCalled();
  });
});

test('카메라 권한이 거부됐으면 설정으로 이동 안내를 보여준다', async () => {
  setPermission({ hasPermission: false, canRequestPermission: false });

  await render(<ScanScreen />);

  expect(
    screen.getByText('카메라 권한이 필요해요. 설정에서 권한을 허용해주세요.'),
  ).toBeTruthy();
  expect(screen.getByText('설정으로 이동')).toBeTruthy();
  // canRequestPermission이 false(=denied)면 더 이상 요청해도 소용없으므로 자동 요청은 안 함.
  expect(mockRequestPermission).not.toHaveBeenCalled();
});

test('카메라 권한이 있으면 카메라 프리뷰를 보여준다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  expect(screen.getByTestId('camera-preview')).toBeTruthy();
});

test('닫기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  fireEvent.press(screen.getByTestId('scan-close-button'));

  expect(mockGoBack).toHaveBeenCalled();
});

test('촬영 버튼을 누르면 사진을 찍고 확인 화면으로 이동한다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  fireEvent.press(screen.getByTestId('scan-capture-button'));

  await waitFor(() => {
    expect(mockCapturePhoto).toHaveBeenCalled();
    expect(mockSaveToTemporaryFileAsync).toHaveBeenCalled();
    expect(mockDispose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('Stacks', {
      screen: 'Confirm',
      params: { imageUri: 'file:///tmp/photo.jpg' },
    });
  });
});

test('갤러리에서 사진을 선택하면 확인 화면으로 이동한다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });
  mockedLaunchImageLibrary.mockResolvedValue({
    didCancel: false,
    assets: [{ uri: 'file:///tmp/gallery.jpg' }],
  });

  await render(<ScanScreen />);

  fireEvent.press(screen.getByTestId('scan-gallery-button'));

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

  fireEvent.press(screen.getByTestId('scan-gallery-button'));

  await waitFor(() => {
    expect(mockedLaunchImageLibrary).toHaveBeenCalled();
  });
  expect(mockNavigate).not.toHaveBeenCalled();
});
