import { parseReceiptText } from './parseReceiptText';

test('점포명/총 액/주문일시 라벨 기준으로 가맹점/금액/날짜를 추출한다', () => {
  const rawText = [
    '점포명 : 스타벅스 강남점',
    '서울 강남구 테헤란로 123',
    '주문일시 : 2026-08-20 14:32:00',
    '아메리카노 Tall   4,500',
    '카페라떼 Grande   5,900',
    '─────────────',
    '총 액          12,400',
  ].join('\n');

  expect(parseReceiptText(rawText)).toEqual({
    merchant: '스타벅스 강남점',
    amount: 12400,
    date: '2026-08-20',
  });
});

test('라벨과 값 사이에 콜론/공백이 없어도 추출한다', () => {
  const rawText = ['점포명GS25 역삼점', '주문일시2026-08-19', '총액6,800'].join(
    '\n',
  );

  expect(parseReceiptText(rawText)).toEqual({
    merchant: 'GS25 역삼점',
    amount: 6800,
    date: '2026-08-19',
  });
});

test('해당 라벨이 없으면 그 필드만 null이다', () => {
  const rawText = '아무 의미 없는 텍스트';

  expect(parseReceiptText(rawText)).toEqual({
    merchant: null,
    amount: null,
    date: null,
  });
});

test('주문일시에 시:분:초가 없어도 날짜만 추출한다', () => {
  const rawText = '주문일시 : 2026-01-05';

  expect(parseReceiptText(rawText).date).toBe('2026-01-05');
});
