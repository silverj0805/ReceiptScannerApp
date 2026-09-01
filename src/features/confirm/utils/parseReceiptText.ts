export interface ParsedReceipt {
  merchant: string | null;
  amount: number | null;
  date: string | null;
}

/**
 * 1. 라벨 표기가 포스기/카드사마다 다르다 ("총액"뿐 아니라 "합계", "결제금액", "승인금액" 등)
 *    라벨 하나만 보면 못 잡는 영수증이 많음.
 * 2. OCR이 한글 단어 "중간"에 임의로 공백을 끼워넣는다(예: "사업지 번호", "대 표지 명")
 *    라벨 글자 사이마다 \s*를 넣어야 이런 케이스를 잡는다.
 */
function looseLabel(label: string): string {
  return label.split('').join('\\s*');
}

/**
 * OCR이 라벨 글자 자체를 비슷한 한글로 바꾸는 실측 혼동 쌍.
 * looseLabel은 글자 사이 공백만 허용하므로, 글자가 바뀐 경우는 여기서 1글자만 치환한 변형을 만든다.
 * 임의 1글자 편집거리는 다른 라벨과 섞일 수 있어 쓰지 않는다.
 */
const OCR_CONFUSABLES: [string, string][] = [
  ['일', '월'],
  ['금', '급'],
  ['액', '맥'],
];

function ocrLabelVariants(label: string): string[] {
  const variants = new Set([label]);
  for (const [a, b] of OCR_CONFUSABLES) {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      let start = 0;
      while (true) {
        const index = label.indexOf(from, start);
        if (index === -1) {
          break;
        }
        variants.add(
          `${label.slice(0, index)}${to}${label.slice(index + from.length)}`,
        );
        start = index + from.length;
      }
    }
  }
  return [...variants];
}

/**
 * 가맹점명.
 * "상호(명)"이 정석 라벨이지만 카드전표 양식에 따라 "점포명"/"가맹점명"/"업체명"도 쓰인다.
 * 라벨이 아예 없는 영수증(예: 라벨 없이 지점명만 찍히는 경우)은 아직 못 잡는다 — 다음 개선 과제
 */
const MERCHANT_LABELS = [
  '상호명',
  '상호',
  '가맹점명',
  '점포명',
  '점포',
  '포명',
  '업체명',
  '기기명',
];
const MERCHANT_PATTERNS = MERCHANT_LABELS.map(
  label => new RegExp(`${looseLabel(label)}\\s*[:：]?\\s*(.+)`),
);

/**
 * 금액.
 * "합계"/"총액" 같은 영수증 자체 라벨이 없는(카드전표만 있는) 경우를 대비해 "승인금액"도 포함.
 * 숫자의 천단위 구분 쉼표(,)를 OCR이 마침표(.)로 잘못 읽는 경우가 흔해서(예: "2.000")
 * 둘 다 허용하고, 숫자로 변환할 때 함께 제거한다.
 * 라벨은 ocrLabelVariants로 1글자 오인식(결제급액, 승인금맥 등)까지 펼친다.
 * 라벨로 못 찾으면 천단위 금액 토큰 중 최댓값을 합계로 본다(findLargestMoneyAmount).
 */
const AMOUNT_LABELS = ['합계', '총액', '결제금액', '승인금액', '받을금액'];
const AMOUNT_LABEL_VARIANTS = AMOUNT_LABELS.flatMap(ocrLabelVariants);
const AMOUNT_PATTERNS = AMOUNT_LABEL_VARIANTS.map(
  label =>
    new RegExp(`${looseLabel(label)}\\s*[:：]?\\s*[₩]?\\s*(\\d[\\d,.]*)`),
);
const AMOUNT_LABEL_LINE = new RegExp(
  AMOUNT_LABEL_VARIANTS.map(looseLabel).join('|'),
);
/** 배달앱 주문서처럼 합계 바로 위에만 있는 `17,900` 형태. 천단위 구분자가 있어야 단가/수량을 덜 집는다. */
const AMOUNT_ABOVE_LINE = /^(\d{1,3}(?:[,.]\d{3})+)$/;
/**
 * 2,000 / 18,000 / 2,000원 / 2,000% / 6, 100 처럼 천단위 구분(콤마·점)이 있는 금액.
 * 5,60처럼 콤마 뒤가 3자리가 아니면 금액으로 보지 않는다.
 */
const MONEY_TOKEN = /\d{1,3}(?:\s*[,.]\s*\d{3})+(?:\s*(?:원|%))?/g;

/**
 * 날짜.
 * "결제일시"가 "주문일시"보다 OCR로 덜 깨지는 경향을 실제로 확인해서 먼저 시도한다.
 * "주문일시"는 앞의 "주"가 OCR로 통째로 누락되는 경우가 있어 optional로 둠.
 * 숫자 구분자(2026-09-01)와 한글 년월일(2026년09월01일)을 같은 라벨에 대해 모두 시도한다.
 * 결제일시→결제월시처럼 실측 혼동 글자도 ocrLabelVariants로 포함한다.
 * 라벨 매칭이 전부 실패하면 DATE_VALUE_PATTERNS_UNLABELED로 본문을 한 번 더 본다(parseDate).
 * 연도가 2~3자리로 깨져도 월·일이 유효하면 복원한다(normalizeYear).
 */
const DATE_LABELS = [
  ...ocrLabelVariants('결제일시').map(looseLabel),
  ...ocrLabelVariants('주문일시').map(looseLabel),
  ...ocrLabelVariants('승인일시').map(looseLabel),
  ...ocrLabelVariants('문일시').map(
    variant => `${looseLabel('주')}?${looseLabel(variant)}`,
  ),
  ...ocrLabelVariants('거래일시').map(looseLabel),
];
const DATE_VALUE_NUMERIC = '(\\d{2,4})[-./](\\d{1,2})[-./](\\d{1,2})';
const DATE_VALUE_NUMERIC_4 = '(\\d{4})[-./](\\d{1,2})[-./](\\d{1,2})';
const DATE_VALUE_KOREAN =
  '(\\d{4})\\s*년\\s*(\\d{1,2})\\s*월\\s*(\\d{1,2})\\s*일';
/** 라벨이 있을 때는 연도 2~3자리(206-08-31)도 허용한다. */
const DATE_VALUE_PATTERNS_LABELED = [DATE_VALUE_NUMERIC, DATE_VALUE_KOREAN];
/**
 * 라벨 없는 본문에서는 4자리 연도만 기본으로 본다.
 * 2~3자리는 전화번호(4333-08-08)와 겹치므로, 뒤에 HH:mm:ss가 있을 때만 허용한다.
 */
const DATE_VALUE_PATTERNS_UNLABELED = [
  DATE_VALUE_NUMERIC_4,
  DATE_VALUE_KOREAN,
  `${DATE_VALUE_NUMERIC}\\s+\\d{1,2}[:：]\\d{2}[:：]\\d{2}`,
];
const DATE_PATTERNS = DATE_LABELS.flatMap(label =>
  DATE_VALUE_PATTERNS_LABELED.map(
    value => new RegExp(`${label}\\s*[:：]?\\s*${value}`),
  ),
);

function matchFirst(patterns: RegExp[], text: string): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
}

function toAmount(raw: string): number {
  return Number(raw.replace(/[,.]/g, ''));
}

/**
 * 라벨로 합계를 못 잡을 때(항목이 여러 줄인 배달 주문서 등) 쓰는 폴백.
 * 금액 포맷에 맞는 토큰만 모은 뒤 최댓값을 고른다. 총액이 단가보다 큰 경우가 많아서다.
 * `6, 100`처럼 자릿수 사이 공백은 지운 다음 파싱한다.
 */
function findLargestMoneyAmount(rawText: string): number | null {
  const tokens = rawText.match(new RegExp(MONEY_TOKEN, 'g'));
  if (!tokens) {
    return null;
  }

  let max: number | null = null;
  for (const token of tokens) {
    const normalized = token.replace(/\s/g, '').replace(/[원%]$/, '');
    const amount = toAmount(normalized);
    if (!Number.isFinite(amount)) {
      continue;
    }
    if (max == null || amount > max) {
      max = amount;
    }
  }
  return max;
}

/**
 * 월·일은 1~12 / 1~31만 받는다. 연도 복원은 normalizeYear에 맡긴다.
 */
function isPlausibleMonthDay(month: number, day: number): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/**
 * OCR이 연도 앞자리를 빠뜨린 경우(2026 → 206, 26)를 복원한다.
 * 월·일이 말이 되고 거래일시 라벨이나 HH:mm:ss가 있으면 연도는 보조 정보로 본다.
 * 3자리는 한 자리를 끼워 2000~2099 후보를 만들고, 오늘 연도에 가장 가까운 값을 고른다.
 */
function normalizeYear(raw: string, nowYear = new Date().getFullYear()): number | null {
  if (raw.length === 4) {
    const year = Number(raw);
    return year >= 2000 && year <= 2099 ? year : null;
  }
  if (raw.length === 2) {
    return 2000 + Number(raw);
  }
  if (raw.length !== 3) {
    return null;
  }

  const candidates: number[] = [];
  for (let pos = 0; pos <= raw.length; pos++) {
    for (let digit = 0; digit <= 9; digit++) {
      const year = Number(`${raw.slice(0, pos)}${digit}${raw.slice(pos)}`);
      if (year >= 2000 && year <= 2099) {
        candidates.push(year);
      }
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((best, year) =>
    Math.abs(year - nowYear) < Math.abs(best - nowYear) ? year : best,
  );
}

function resolveParsedDate(
  yearRaw: string,
  monthRaw: string,
  dayRaw: string,
): string | null {
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!isPlausibleMonthDay(month, day)) {
    return null;
  }
  const year = normalizeYear(yearRaw);
  if (year == null) {
    return null;
  }
  return formatParsedDate(String(year), month, day);
}

function formatParsedDate(year: string, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
    2,
    '0',
  )}`;
}

function matchPlausibleDateValue(
  valuePattern: string,
  rawText: string,
): string | null {
  for (const match of rawText.matchAll(new RegExp(valuePattern, 'g'))) {
    const resolved = resolveParsedDate(match[1], match[2], match[3]);
    if (resolved) {
      return resolved;
    }
  }
  return null;
}

/**
 * 라벨이 붙은 패턴을 먼저 시도한다. 결제일시가 주문일시보다 앞선 우선순위를 유지하기 위함이다.
 * 라벨이 없거나 붙은 값이 전부 달력 범위 밖이면 DATE_VALUE_PATTERNS_UNLABELED로 본문을 한 번 더 본다.
 */
function parseDate(rawText: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = rawText.match(pattern);
    if (!match) {
      continue;
    }
    const resolved = resolveParsedDate(match[1], match[2], match[3]);
    if (resolved) {
      return resolved;
    }
  }

  for (const valuePattern of DATE_VALUE_PATTERNS_UNLABELED) {
    const unlabeled = matchPlausibleDateValue(valuePattern, rawText);
    if (unlabeled) {
      return unlabeled;
    }
  }
  return null;
}

/**
 * 라벨 뒤 숫자를 먼저 찾고, 없으면 라벨이 있는 줄의 바로 위 한 줄만 본다.
 * 쿠팡이츠 주문서처럼 `17,900` 다음 줄이 `합계`인 레이아웃용이다.
 * 위를 N줄 훑으면 품목 단가(6,200)를 집을 수 있어 바로 위 1줄 + 천단위 구분자 줄만 허용한다.
 * 라벨 매칭이 전부 실패하면 금액 포맷 토큰 중 최댓값을 합계로 본다.
 */
function parseAmount(rawText: string): number | null {
  const forward = matchFirst(AMOUNT_PATTERNS, rawText);
  if (forward) {
    return toAmount(forward[1]);
  }

  const lines = rawText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (i === 0 || !AMOUNT_LABEL_LINE.test(lines[i])) {
      continue;
    }
    const above = lines[i - 1].replace(/\s/g, '');
    const aboveMatch = above.match(AMOUNT_ABOVE_LINE);
    if (aboveMatch) {
      return toAmount(aboveMatch[1]);
    }
  }
  return findLargestMoneyAmount(rawText);
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const merchantMatch = matchFirst(MERCHANT_PATTERNS, rawText);

  return {
    merchant: merchantMatch ? merchantMatch[1].trim() : null,
    amount: parseAmount(rawText),
    date: parseDate(rawText),
  };
}
