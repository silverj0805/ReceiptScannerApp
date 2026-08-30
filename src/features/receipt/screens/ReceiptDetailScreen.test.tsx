import { useNavigation, useRoute } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import type { Receipt } from '@/features/receipt/api/types/receipt';
import { server } from '@/mocks/server';

import ReceiptDetailScreen from './ReceiptDetailScreen';

// ConfirmScreen.test.tsx와 동일한 이유로 useNavigation/useRoute 훅을 목 처리.
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));
const mockedUseNavigation = useNavigation as jest.Mock;
const mockedUseRoute = useRoute as jest.Mock;

const renderDetailScreen = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReceiptDetailScreen />
    </QueryClientProvider>,
  );
};

const RAW_TEXT = [
  '스타벅스 강남점',
  '서울 강남구 테헤란로 123',
  '아메리카노 Tall   4,500',
  '카페라떼 Grande   5,900',
  '─────────────',
  '합계          12,400',
].join('\n');

const FIXTURE: Receipt = {
  id: 1,
  merchant: '스타벅스 강남점',
  category: 'food',
  date: '2026-08-20',
  amount: 12400,
  rawText: RAW_TEXT,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseNavigation.mockReturnValue({ goBack: mockGoBack });
  mockedUseRoute.mockReturnValue({ params: { receiptId: '1' } });
  server.use(
    http.get('*/receipts/:id', ({ params }) => {
      if (params.id !== '1') {
        return HttpResponse.json({ message: 'not found' }, { status: 404 });
      }
      return HttpResponse.json(FIXTURE);
    }),
  );
});

test('데이터 도착 전엔 로딩 상태를 보여준다', async () => {
  await renderDetailScreen();

  expect(screen.getByTestId('receipt-detail-loading')).toBeTruthy();

  await waitFor(() => {
    expect(screen.queryByTestId('receipt-detail-loading')).toBeNull();
  });
});

test('영수증 정보를 보여준다', async () => {
  await renderDetailScreen();

  await waitFor(() => {
    expect(screen.getByText('스타벅스 강남점')).toBeTruthy();
  });
  expect(screen.getByText('식비')).toBeTruthy();
  expect(screen.getByText('₩12,400')).toBeTruthy();
  // date는 YYYY-MM-DD만 오므로(시간 없음) 요일까지만 표기 — 2026-08-20은 목요일.
  expect(screen.getByText('2026.08.20 (목)')).toBeTruthy();
});

test('인식된 원문은 기본적으로 펼쳐져 있고, 토글을 누르면 접고 펼 수 있다', async () => {
  await renderDetailScreen();
  await waitFor(() => {
    expect(screen.getByText('스타벅스 강남점')).toBeTruthy();
  });

  expect(screen.getByText(RAW_TEXT)).toBeTruthy();

  await fireEvent.press(screen.getByText('인식된 원문'));
  expect(screen.queryByText(RAW_TEXT)).toBeNull();

  await fireEvent.press(screen.getByText('인식된 원문'));
  expect(screen.getByText(RAW_TEXT)).toBeTruthy();
});

test('원문이 없으면 인식된 원문 섹션 자체를 보여주지 않는다', async () => {
  server.use(
    http.get('*/receipts/:id', () =>
      HttpResponse.json({ ...FIXTURE, rawText: undefined }),
    ),
  );

  await renderDetailScreen();
  await waitFor(() => {
    expect(screen.getByText('스타벅스 강남점')).toBeTruthy();
  });

  expect(screen.queryByText('인식된 원문')).toBeNull();
});

test('뒤로가기 버튼을 누르면 이전 화면으로 돌아간다', async () => {
  await renderDetailScreen();
  await waitFor(() => {
    expect(screen.getByText('스타벅스 강남점')).toBeTruthy();
  });

  await fireEvent.press(screen.getByTestId('detail-back-button'));

  expect(mockGoBack).toHaveBeenCalled();
});

test('존재하지 않거나 다른 기기 소유의 영수증이면(404) 안내 문구를 보여준다', async () => {
  mockedUseRoute.mockReturnValue({ params: { receiptId: '999' } });

  await renderDetailScreen();

  await waitFor(() => {
    expect(screen.getByText('영수증을 찾을 수 없어요')).toBeTruthy();
  });
});

test('그 외 에러가 나면 재시도 안내 문구를 보여준다', async () => {
  server.use(
    http.get('*/receipts/:id', () =>
      HttpResponse.json({ message: 'error' }, { status: 500 }),
    ),
  );

  await renderDetailScreen();

  await waitFor(() => {
    expect(
      screen.getByText('영수증을 불러오지 못했어요. 다시 시도해주세요.'),
    ).toBeTruthy();
  });
});
