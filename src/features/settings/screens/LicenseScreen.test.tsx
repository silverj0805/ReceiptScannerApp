import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { licenseData } from '../constants/licenseData';

import LicenseScreen from './LicenseScreen';

// LicenseScreen이 useNavigation() 훅이 아니라 navigation prop을 직접 받으므로
// (HomeScreen.test.tsx와 동일한 패턴) 목 객체를 prop으로 바로 넘긴다.
const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack } as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue();
});

// axios는 package.json dependencies에 항상 있고 repositoryUrl도 확실히 있어서 기준으로 씀.
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
