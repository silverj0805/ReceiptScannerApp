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

// Camera는 네이티브 프리뷰 뷰라서 Jest에서 그릴 수 없어 View로 대체.
// 실제 Camera는 testID를 지원 안 하지만(CameraViewProps에 없음), 목에서는 받은 props를
// 그대로 View에 넘겨서 onPreviewStarted/onError를 fireEvent(getByTestId('camera'), ...)로
// 트리거할 수 있게 한다.
// usePhotoOutput/useCameraDevice/useCameraPermission도 전부 네이티브 값을 반환하므로 목 처리.
jest.mock('react-native-vision-camera', () => {
  const { View } = require('react-native');
  return {
    Camera: (props: Record<string, unknown>) => (
      <View testID="camera" {...props} />
    ),
    // 값 자체는 실제로 안 쓰이고(usePhotoOutput이 통째로 목 처리됨) ScanScreen.tsx가
    // import 시점에 CommonResolutions.UHD_4_3을 참조하므로 존재만 하면 됨.
    CommonResolutions: { UHD_4_3: { width: 3024, height: 4032 } },
    useCameraDevice: jest.fn(),
    useCameraPermission: jest.fn(),
    usePhotoOutput: jest.fn(),
  };
});

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

test('카메라 프리뷰가 첫 프레임을 그리기 전까지는 로딩 스피너를 보여준다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  expect(screen.getByTestId('camera-loading')).toBeTruthy();
});

test('카메라 프리뷰가 시작되면 로딩 스피너가 사라진다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);
  await fireEvent(screen.getByTestId('camera'), 'previewStarted');

  await waitFor(() => {
    expect(screen.queryByTestId('camera-loading')).toBeNull();
  });
});

test('카메라 초기화에 실패해도 로딩 스피너가 계속 뜨지 않는다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);
  await fireEvent(screen.getByTestId('camera'), 'error');

  await waitFor(() => {
    expect(screen.queryByTestId('camera-loading')).toBeNull();
  });
});

test('헤더 아래에 인식률을 높이는 촬영 팁 안내 문구를 보여준다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  expect(
    screen.getByText(
      '인식률을 높이기 위해 선명한 화질로 필요한 정보만 가까이서 찍어주세요',
    ),
  ).toBeTruthy();
});

test('닫기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByTestId('scan-close-button'));

  expect(mockGoBack).toHaveBeenCalled();
});

test('촬영 버튼을 누르면 사진을 찍어서 확인 화면으로 이동한다', async () => {
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByTestId('scan-capture-button'));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('Stacks', {
      screen: 'Confirm',
      params: { imageUri: 'file:///tmp/photo.jpg' },
    });
  });
  expect(mockCapturePhoto).toHaveBeenCalledWith({ flashMode: 'off' }, {});
  expect(mockSaveToTemporaryFileAsync).toHaveBeenCalled();
  expect(mockDispose).toHaveBeenCalled();
});

test('촬영 중에는 버튼이 비활성화돼서 연속 촬영을 막는다', async () => {
  mockCapturePhoto.mockReturnValue(new Promise(() => {})); // 영원히 pending
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  // capturePhoto가 영원히 pending이라 await하면(act flush가 끝나길 기다림) 테스트가
  // 타임아웃남(ConfirmScreen의 저장 중 로딩 테스트와 동일한 이유) — await 없이
  // 이벤트만 트리거하고 waitFor로 결과만 폴링.
  fireEvent.press(screen.getByTestId('scan-capture-button'));

  await waitFor(() => {
    expect(
      screen.getByTestId('scan-capture-button').props.accessibilityState
        .disabled,
    ).toBe(true);
  });

  // 비활성화된 상태에서 다시 눌러도 capturePhoto가 중복 호출되지 않아야 함.
  fireEvent.press(screen.getByTestId('scan-capture-button'));
  expect(mockCapturePhoto).toHaveBeenCalledTimes(1);
});

test('촬영이 실패하면 다시 촬영할 수 있게 버튼이 풀린다', async () => {
  mockCapturePhoto.mockRejectedValue(new Error('CAPTURE_ERROR'));
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByTestId('scan-capture-button'));

  await waitFor(() => {
    expect(
      screen.getByTestId('scan-capture-button').props.accessibilityState
        .disabled,
    ).toBe(false);
  });
});

test('촬영 결과 경로에 스킴이 없으면 file:// 스킴을 붙여서 넘긴다', async () => {
  // 실기기(Android)에서 실제로 오는 값 그대로: 스킴 없는 순수 파일 경로.
  // 스킴이 없으면 네이티브 OCR 모듈이 파일을 못 찾고 조용히 reject되기 때문에,
  // capture()가 여기서 file://를 붙여주는지 검증한다.
  mockSaveToTemporaryFileAsync.mockResolvedValue(
    '/data/user/0/com.silverj0805.receiptscannerapp/cache/VisionCamera_1.jpg',
  );
  setPermission({ hasPermission: true, canRequestPermission: false });

  await render(<ScanScreen />);

  await fireEvent.press(screen.getByTestId('scan-capture-button'));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('Stacks', {
      screen: 'Confirm',
      params: {
        imageUri:
          'file:///data/user/0/com.silverj0805.receiptscannerapp/cache/VisionCamera_1.jpg',
      },
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
