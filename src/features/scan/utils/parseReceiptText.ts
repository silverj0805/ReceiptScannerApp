export interface ParsedReceipt {
  merchant: string | null;
  amount: number | null;
  date: string | null;
}

// 실기기 실제 OCR 원문을 보면 두 가지가 처음 가정과 달랐다:
// 1. 라벨 표기가 포스기/카드사마다 다르다 ("총액"뿐 아니라 "합계", "결제금액",
//    카드전표의 "승인금액" 등) — 라벨 하나만 보면 못 잡는 영수증이 많음.
// 2. OCR이 한글 단어 "중간"에 임의로 공백을 끼워넣는다(예: "사업지 번호",
//    "대 표지 명"). 라벨 글자 사이마다 \s*를 넣어야 이런 케이스를 잡는다.
function looseLabel(label: string): string {
  return label.split('').join('\\s*');
}

function matchFirst(patterns: RegExp[], text: string): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
}

// 가맹점명. "상호(명)"이 정석 라벨이지만 카드전표 양식에 따라 "점포명"/"가맹점명"/
// "업체명"도 쓰인다. 라벨이 아예 없는 영수증(예: 라벨 없이 지점명만 찍히는 경우)은
// 아직 못 잡는다 — 다음 개선 과제.
const MERCHANT_LABELS = ['상호명', '상호', '가맹점명', '점포명', '업체명'];
const MERCHANT_PATTERNS = MERCHANT_LABELS.map(
  label => new RegExp(`${looseLabel(label)}\\s*[:：]?\\s*(.+)`),
);

// 금액. "합계"/"총액" 같은 영수증 자체 라벨이 없는(카드전표만 있는) 경우를 대비해
// "승인금액"도 포함. 숫자의 천단위 구분 쉼표(,)를 OCR이 마침표(.)로 잘못 읽는 경우가
// 흔해서(예: "2.000") 둘 다 허용하고, 숫자로 변환할 때 함께 제거한다.
const AMOUNT_LABELS = ['합계', '총액', '결제금액', '승인금액', '받을금액'];
const AMOUNT_PATTERNS = AMOUNT_LABELS.map(
  label =>
    new RegExp(`${looseLabel(label)}\\s*[:：]?\\s*[₩]?\\s*(\\d[\\d,.]*)`),
);

// 날짜. "결제일시"가 "주문일시"보다 OCR로 덜 깨지는 경향을 실제로 확인해서 먼저
// 시도한다. "주문일시"는 앞의 "주"가 OCR로 통째로 누락되는 경우가 있어 optional로 둠.
const DATE_PATTERNS = [
  new RegExp(
    `${looseLabel('결제일시')}\\s*[:：]?\\s*(\\d{4})[-./](\\d{2})[-./](\\d{2})`,
  ),
  new RegExp(
    `${looseLabel('승인일시')}\\s*[:：]?\\s*(\\d{4})[-./](\\d{2})[-./](\\d{2})`,
  ),
  new RegExp(
    `${looseLabel('주')}?${looseLabel('문일시')}\\s*[:：]?\\s*(\\d{4})[-./](\\d{2})[-./](\\d{2})`,
  ),
  new RegExp(
    `${looseLabel('거래일시')}\\s*[:：]?\\s*(\\d{4})[-./](\\d{2})[-./](\\d{2})`,
  ),
];

export function parseReceiptText(rawText: string): ParsedReceipt {
  const merchantMatch = matchFirst(MERCHANT_PATTERNS, rawText);
  const amountMatch = matchFirst(AMOUNT_PATTERNS, rawText);
  const dateMatch = matchFirst(DATE_PATTERNS, rawText);

  return {
    merchant: merchantMatch ? merchantMatch[1].trim() : null,
    amount: amountMatch ? Number(amountMatch[1].replace(/[,.]/g, '')) : null,
    date: dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null,
  };
}
