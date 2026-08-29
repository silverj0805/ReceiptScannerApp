import { render, screen, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import type { Receipt, ReceiptSummary } from '@/features/receipt/api/types';
import { server } from '@/mocks/server';

import HomeScreen from './HomeScreen';

test('데이터 도착 전엔 로딩 상태를 보여준다', () => {
  render(<HomeScreen />);

  // ActivityIndicator 등 텍스트 없는 로딩 UI를 쓸 수 있어서 텍스트 대신 testID로 확인.
  expect(screen.getByTestId('home-loading')).toBeTruthy();
});

test('데이터 도착 후 이번 달 지출 요약을 보여준다', async () => {
  render(<HomeScreen />);

  await waitFor(() => {
    expect(screen.getByText('₩842,300')).toBeTruthy();
    expect(screen.getByText('-12%')).toBeTruthy();
  });
});

test('데이터 도착 후 최근 영수증 리스트를 보여준다', async () => {
  render(<HomeScreen />);

  await waitFor(() => {
    expect(screen.getByText('스타벅스 강남점')).toBeTruthy();
  });

  // 가맹점/한글 카테고리 라벨/날짜/금액이 각 영수증마다 정확히 렌더링되는지 확인.
  expect(screen.getByText('식비')).toBeTruthy();
  expect(screen.getByText('8월 20일')).toBeTruthy();
  expect(screen.getByText('₩12,400')).toBeTruthy();

  expect(screen.getByText('GS25 역삼점')).toBeTruthy();
  expect(screen.getByText('기타')).toBeTruthy();
  expect(screen.getByText('8월 19일')).toBeTruthy();
  expect(screen.getByText('₩6,800')).toBeTruthy();

  expect(screen.getByText('카카오T')).toBeTruthy();
  expect(screen.getByText('교통')).toBeTruthy();
  expect(screen.getByText('8월 18일')).toBeTruthy();
  expect(screen.getByText('₩9,200')).toBeTruthy();

  expect(screen.getByText('올리브영')).toBeTruthy();
  expect(screen.getByText('쇼핑')).toBeTruthy();
  expect(screen.getByText('8월 17일')).toBeTruthy();
  expect(screen.getByText('₩34,000')).toBeTruthy();
});

test('영수증이 하나도 없으면 요약 금액/증감률을 0으로 보여준다', async () => {
  // 이 테스트에서만 summary 응답을 빈 상태로 덮어씀(afterEach의 server.resetHandlers로
  // 다음 테스트엔 영향 없음) — 기본 handlers.ts의 happy-path 픽스처는 그대로 둠.
  const emptySummary: ReceiptSummary = {
    total: 0,
    deltaPercent: 0,
    byCategory: [],
  };
  server.use(
    http.get('*/receipts/summary', () => HttpResponse.json(emptySummary)),
  );

  render(<HomeScreen />);

  await waitFor(() => {
    expect(screen.getByText('₩0')).toBeTruthy();
    expect(screen.getByText('0%')).toBeTruthy();
  });
});

test('영수증이 하나도 없으면 안내 문구를 보여준다', async () => {
  const emptyReceipts: Receipt[] = [];
  server.use(http.get('*/receipts', () => HttpResponse.json(emptyReceipts)));

  render(<HomeScreen />);

  await waitFor(() => {
    expect(screen.getByText('아직 기록된 영수증이 없어요')).toBeTruthy();
  });
});
