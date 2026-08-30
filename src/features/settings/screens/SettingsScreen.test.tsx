import { useNavigation } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { getVersion } from 'react-native-device-info';

import SettingsScreen from './SettingsScreen';

// ConfirmScreen.test.tsx와 동일한 이유로 useNavigation 훅을 목 처리.
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
}));
const mockedUseNavigation = useNavigation as jest.Mock;
const mockedGetVersion = getVersion as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseNavigation.mockReturnValue({
    goBack: mockGoBack,
    navigate: mockNavigate,
  });
  mockedGetVersion.mockReturnValue('1.0.0');
});

test('설정 타이틀을 보여준다', async () => {
  await render(<SettingsScreen navigation={mockedUseNavigation()} />);

  expect(screen.getByText('설정')).toBeTruthy();
});

test('오픈소스 라이센스 항목과 앱 버전을 보여준다', async () => {
  await render(<SettingsScreen navigation={mockedUseNavigation()} />);

  expect(screen.getByText('오픈소스 라이센스')).toBeTruthy();
  expect(screen.getByText('앱 버전')).toBeTruthy();
  expect(screen.getByTestId('settings-app-version')).toHaveTextContent('1.0.0');
});

test('오픈소스 라이센스를 누르면 License 화면으로 이동한다', async () => {
  await render(<SettingsScreen navigation={mockedUseNavigation()} />);

  await fireEvent.press(screen.getByTestId('settings-license-row'));

  expect(mockNavigate).toHaveBeenCalledWith('License');
});

test('뒤로가기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
  await render(<SettingsScreen navigation={mockedUseNavigation()} />);

  await fireEvent.press(screen.getByTestId('settings-back-button'));

  expect(mockGoBack).toHaveBeenCalled();
});
