import { useNavigation, useRoute } from '@react-navigation/native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import WebViewScreen from './WebViewScreen';

// ConfirmScreen.test.tsx와 동일한 이유로 useNavigation/useRoute 훅을 목 처리.
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));
const mockedUseNavigation = useNavigation as jest.Mock;
const mockedUseRoute = useRoute as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseNavigation.mockReturnValue({ goBack: mockGoBack });
});

test('헤더에 route.params.title을 보여준다', async () => {
  mockedUseRoute.mockReturnValue({
    params: { url: 'https://example.com/privacy', title: '개인정보처리방침' },
  });

  await render(<WebViewScreen />);

  expect(screen.getByText('개인정보처리방침')).toBeTruthy();
});

test('url이 아직 없으면 준비 중 안내를 보여주고 WebView는 렌더링하지 않는다', async () => {
  mockedUseRoute.mockReturnValue({ params: { url: '', title: '이용약관' } });

  await render(<WebViewScreen />);

  expect(screen.getByTestId('webview-not-ready')).toBeTruthy();
  expect(screen.queryByTestId('webview')).toBeNull();
});

test('url이 있으면 처음엔 로딩 인디케이터를 보여주다가, 로드가 끝나면 사라진다', async () => {
  mockedUseRoute.mockReturnValue({
    params: { url: 'https://example.com/terms', title: '이용약관' },
  });

  await render(<WebViewScreen />);

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

  await render(<WebViewScreen />);

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

  await render(<WebViewScreen />);

  await fireEvent.press(screen.getByTestId('webview-back-button'));

  expect(mockGoBack).toHaveBeenCalled();
});
