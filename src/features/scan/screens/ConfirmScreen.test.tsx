import { useNavigation, useRoute } from '@react-navigation/native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import NativeReceiptScanner from '@specs/NativeReceiptScanner';

import ConfirmScreen from './ConfirmScreen';

// ConfirmScreen이 navigation prop이 아니라 useNavigation()/useRoute() 훅을 직접 쓰므로
// (ScanScreen과 동일한 이유로) 훅 자체를 목 처리한다.
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

const mockedUseNavigation = useNavigation as jest.Mock;
const mockedUseRoute = useRoute as jest.Mock;
const mockedScanText = NativeReceiptScanner.scanText as jest.Mock;

const RAW_TEXT_SUCCESS = [
  '점포명 : 스타벅스 강남점',
  '서울 강남구 테헤란로 123',
  '주문일시 : 2026-08-20 14:32:00',
  '아메리카노 Tall   4,500',
  '카페라떼 Grande   5,900',
  '총 액          12,400',
].join('\n');

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseNavigation.mockReturnValue({ goBack: mockGoBack });
  mockedUseRoute.mockReturnValue({
    params: { imageUri: 'file:///tmp/photo.jpg' },
  });
});

test('인식 중엔 로딩 상태를 보여준다', async () => {
  mockedScanText.mockReturnValue(new Promise(() => {})); // 영원히 pending

  await render(<ConfirmScreen />);

  expect(screen.getByTestId('confirm-loading')).toBeTruthy();
});

test('인식에 성공하면 점포명/총액/주문일시로 폼을 채운다', async () => {
  mockedScanText.mockResolvedValue(RAW_TEXT_SUCCESS);

  await render(<ConfirmScreen />);

  await waitFor(() => {
    expect(screen.getByDisplayValue('스타벅스 강남점')).toBeTruthy();
    expect(screen.getByDisplayValue('12400')).toBeTruthy();
    expect(screen.getByDisplayValue('2026-08-20')).toBeTruthy();
  });
});

test('인식된 원문 토글을 누르면 원문을 펼치고 접는다', async () => {
  mockedScanText.mockResolvedValue(RAW_TEXT_SUCCESS);

  await render(<ConfirmScreen />);
  await waitFor(() => {
    expect(screen.getByDisplayValue('스타벅스 강남점')).toBeTruthy();
  });

  expect(screen.queryByText(RAW_TEXT_SUCCESS)).toBeNull();

  await fireEvent.press(screen.getByText('인식된 원문'));
  expect(screen.getByText(RAW_TEXT_SUCCESS)).toBeTruthy();

  await fireEvent.press(screen.getByText('인식된 원문'));
  expect(screen.queryByText(RAW_TEXT_SUCCESS)).toBeNull();
});

test('텍스트 인식에 실패하면(빈 문자열) 안내를 보여준다', async () => {
  mockedScanText.mockResolvedValue('');

  await render(<ConfirmScreen />);

  await waitFor(() => {
    expect(screen.getByText('텍스트를 인식하지 못했어요')).toBeTruthy();
  });
  expect(screen.getByText('다시 촬영')).toBeTruthy();
  expect(screen.getByText('직접 입력')).toBeTruthy();
});

test('scanText가 실패(reject)해도 죽지 않고 인식 실패 화면을 보여준다', async () => {
  // 존재하지 않는 imageUri 등으로 네이티브 쪽(ReceiptScannerModule.kt)이 reject하는 경우.
  // .catch() 없이 방치하면 unhandled rejection으로 앱이 죽은 것처럼 보였던 회귀 재발 방지.
  mockedScanText.mockRejectedValue(new Error('SCAN_ERROR'));

  await render(<ConfirmScreen />);

  await waitFor(() => {
    expect(screen.getByText('텍스트를 인식하지 못했어요')).toBeTruthy();
  });
});

test('인식 실패 화면에서 다시 촬영을 누르면 이전 화면으로 돌아간다', async () => {
  mockedScanText.mockResolvedValue('');

  await render(<ConfirmScreen />);
  await waitFor(() => {
    expect(screen.getByText('텍스트를 인식하지 못했어요')).toBeTruthy();
  });

  await fireEvent.press(screen.getByText('다시 촬영'));

  expect(mockGoBack).toHaveBeenCalled();
});

test('인식 실패 화면에서 직접 입력을 누르면 빈 폼으로 전환된다', async () => {
  mockedScanText.mockResolvedValue('');

  await render(<ConfirmScreen />);
  await waitFor(() => {
    expect(screen.getByText('텍스트를 인식하지 못했어요')).toBeTruthy();
  });

  await fireEvent.press(screen.getByText('직접 입력'));

  expect(screen.getByTestId('merchant-input').props.value).toBe('');
  expect(screen.getByTestId('amount-input').props.value).toBe('');
});

test('카테고리를 선택할 수 있다', async () => {
  mockedScanText.mockResolvedValue(RAW_TEXT_SUCCESS);

  await render(<ConfirmScreen />);
  await waitFor(() => {
    expect(screen.getByDisplayValue('스타벅스 강남점')).toBeTruthy();
  });

  await fireEvent.press(screen.getByTestId('category-transit'));

  expect(screen.getByTestId('category-transit').props.accessibilityState)
    .toMatchObject({ selected: true });
  expect(screen.getByTestId('category-food').props.accessibilityState)
    .toMatchObject({ selected: false });
});

test('필드를 채웠다 비우면 해당 필드의 에러 메시지를 보여준다', async () => {
  mockedScanText.mockResolvedValue('');

  await render(<ConfirmScreen />);
  await waitFor(() => {
    expect(screen.getByText('텍스트를 인식하지 못했어요')).toBeTruthy();
  });
  await fireEvent.press(screen.getByText('직접 입력'));

  // mode: 'onChange'라 필드를 한 번 건드려야 검증이 도는데, 이미 빈 값이므로
  // 값이 있다가 지워지는 상황을 만들어서 required 검증을 트리거함.
  await fireEvent.changeText(screen.getByTestId('merchant-input'), '가');
  await fireEvent.changeText(screen.getByTestId('merchant-input'), '');
  await fireEvent.changeText(screen.getByTestId('date-input'), '2026/08/20');

  await waitFor(() => {
    expect(screen.getByText('가맹점명을 입력해주세요')).toBeTruthy();
    expect(screen.getByText('YYYY-MM-DD 형식으로 입력해주세요')).toBeTruthy();
  });
});

test('직접 입력 모드에서는 처음엔 저장하기 버튼이 비활성화돼 있다', async () => {
  mockedScanText.mockResolvedValue('');

  await render(<ConfirmScreen />);
  await waitFor(() => {
    expect(screen.getByText('텍스트를 인식하지 못했어요')).toBeTruthy();
  });
  await fireEvent.press(screen.getByText('직접 입력'));

  expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(true);
});

test('인식에 성공해도 카테고리를 직접 고르기 전까지는 저장하기 버튼이 비활성화돼 있다', async () => {
  mockedScanText.mockResolvedValue(RAW_TEXT_SUCCESS);

  await render(<ConfirmScreen />);
  await waitFor(() => {
    expect(screen.getByDisplayValue('스타벅스 강남점')).toBeTruthy();
  });

  // 가맹점명/금액/날짜는 자동 인식으로 채워졌지만 카테고리는 아직 안 골랐음.
  expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(true);
});

test('가맹점명/금액/날짜/카테고리를 모두 채우면 저장하기 버튼이 활성화된다', async () => {
  mockedScanText.mockResolvedValue(RAW_TEXT_SUCCESS);

  await render(<ConfirmScreen />);
  await waitFor(() => {
    expect(screen.getByDisplayValue('스타벅스 강남점')).toBeTruthy();
  });
  expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(true);

  await fireEvent.press(screen.getByTestId('category-food'));

  await waitFor(() => {
    expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(false);
  });
});
