import { useNavigation } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { licenseData } from '../constants/licenseData';

import LicenseScreen from './LicenseScreen';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
}));
const mockedUseNavigation = useNavigation as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseNavigation.mockReturnValue({ goBack: mockGoBack });
  jest.spyOn(Linking, 'openURL').mockResolvedValue();
});

// axios는 package.json dependencies에 항상 있고 repositoryUrl도 확실히 있어서 기준으로 씀.
const axios = licenseData.find(item => item.packageName === 'axios')!;

test('헤더 타이틀을 보여준다', async () => {
  await render(<LicenseScreen />);

  expect(screen.getByText('오픈소스 라이센스')).toBeTruthy();
});

test('package.json dependencies의 패키지명/버전/라이센스명을 목록으로 보여준다', async () => {
  await render(<LicenseScreen />);

  expect(
    screen.getByText(`${axios.packageName} (${axios.version})`),
  ).toBeTruthy();
  expect(screen.getAllByText(axios.licenseName).length).toBeGreaterThan(0);
});

test('패키지 항목을 누르면 저장소 링크를 연다', async () => {
  await render(<LicenseScreen />);

  await fireEvent.press(
    screen.getByTestId(`license-item-${axios.packageName}`),
  );

  expect(Linking.openURL).toHaveBeenCalledWith(axios.repositoryUrl);
});

test('뒤로가기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
  await render(<LicenseScreen />);

  await fireEvent.press(screen.getByTestId('license-back-button'));

  expect(mockGoBack).toHaveBeenCalled();
});
