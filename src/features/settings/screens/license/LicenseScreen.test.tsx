import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { licenseData } from '../../constants/licenseData';

import LicenseScreen from './index.tsx';

const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack } as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue();
});

const axios = licenseData.find(item => item.packageName === 'axios')!;

test('헤더 타이틀을 보여준다', async () => {
  await render(<LicenseScreen navigation={mockNavigation} />);

  expect(screen.getByText('오픈소스 라이센스')).toBeTruthy();
});

test('package.json dependencies의 패키지명/버전/라이센스명을 목록으로 보여준다', async () => {
  await render(<LicenseScreen navigation={mockNavigation} />);

  expect(
    screen.getByText(`${axios.packageName} (${axios.version})`),
  ).toBeTruthy();
  expect(screen.getAllByText(axios.licenseName).length).toBeGreaterThan(0);
});

test('패키지 항목을 누르면 저장소 링크를 연다', async () => {
  await render(<LicenseScreen navigation={mockNavigation} />);

  await fireEvent.press(
    screen.getByTestId(`license-item-${axios.packageName}`),
  );

  expect(Linking.openURL).toHaveBeenCalledWith(axios.repositoryUrl);
});

test('뒤로가기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
  await render(<LicenseScreen navigation={mockNavigation} />);

  await fireEvent.press(screen.getByTestId('license-back-button'));

  expect(mockGoBack).toHaveBeenCalled();
});
