import { useRoute } from '@react-navigation/native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import WebViewScreen from './WebViewScreen';

// WebViewScreen이 useNavigation() 훅이 아니라 navigation prop을 직접 받으므로
// (LicenseScreen.test.tsx와 동일한 패턴) 목 객체를 prop으로 바로 넘긴다.
// route.params는 여전히 useRoute() 훅으로 받으므로 그것만 목 처리.
const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack } as never;
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: jest.fn(),
}));
const mockedUseRoute = useRoute as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test('헤더에 route.params.title을 보여준다', async () => {
  mockedUseRoute.mockReturnValue({
    params: { url: 'https://example.com/privacy', title: '개인정보처리방침' },
  });

  await render(<WebViewScreen navigation={mockNavigation} />);

  expect(screen.getByText('개인정보처리방침')).toBeTruthy();
});

test('url이 아직 없으면 준비 중 안내를 보여주고 WebView는 렌더링하지 않는다', async () => {
  mockedUseRoute.mockReturnValue({ params: { url: '', title: '이용약관' } });

  await render(<WebViewScreen navigation={mockNavigation} />);

  expect(screen.getByTestId('webview-not-ready')).toBeTruthy();
  expect(screen.queryByTestId('webview')).toBeNull();
});

test('url이 있으면 처음엔 로딩 인디케이터를 보여주다가, 로드가 끝나면 사라진다', async () => {
  mockedUseRoute.mockReturnValue({
    params: { url: 'https://example.com/terms', title: '이용약관' },
  });

  await render(<WebViewScreen navigation={mockNavigation} />);

  expect(screen.getByTestId('webview')).toBeTruthy();
  expect(screen.getByTestId('webview-loading')).toBeTruthy();

  fireEvent(screen.getByTestId('webview'), 'loadEnd');

  await waitFor(() => {
    expect(screen.queryByTestId('webview-loading')).toBeNull();
  });
});

test('로드에 실패하면 에러 안내를 보여준다', async () => {
  mockedUseRoute.mockReturnValue({
    params: { url: 'https://example.com/terms', title: '이용약관' },
  });

  await render(<WebViewScreen navigation={mockNavigation} />);

  fireEvent(screen.getByTestId('webview'), 'error');

  await waitFor(() => {
    expect(screen.getByTestId('webview-error')).toBeTruthy();
  });
  expect(screen.queryByTestId('webview')).toBeNull();
});

test('뒤로가기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
  mockedUseRoute.mockReturnValue({
    params: { url: 'https://example.com/terms', title: '이용약관' },
  });

  await render(<WebViewScreen navigation={mockNavigation} />);

  await fireEvent.press(screen.getByTestId('webview-back-button'));

  expect(mockGoBack).toHaveBeenCalled();
});
