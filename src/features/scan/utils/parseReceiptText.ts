export interface ParsedReceipt {
  merchant: string | null;
  amount: number | null;
  date: string | null;
}

// 실제 포스기 영수증 OCR 원문의 라벨 기준(사용자 지정):
// - 가맹점명은 "점포명" 라벨 옆
// - 총액은 "총 액"(사이 공백 있을 수 있음) 라벨 옆, 콤마/₩ 포함될 수 있음
// - 날짜는 "주문일시" 라벨 옆 YYYY-MM-DD(HH:mm:ss는 선택)
const MERCHANT_PATTERN = /점포명\s*:?\s*(.+)/;
const AMOUNT_PATTERN = /총\s*액\s*:?\s*[₩]?\s*([\d,]+)/;
const DATE_PATTERN = /주문일시\s*:?\s*(\d{4}-\d{2}-\d{2})/;

export function parseReceiptText(rawText: string): ParsedReceipt {
  const merchantMatch = rawText.match(MERCHANT_PATTERN);
  const amountMatch = rawText.match(AMOUNT_PATTERN);
  const dateMatch = rawText.match(DATE_PATTERN);

  return {
    merchant: merchantMatch ? merchantMatch[1].trim() : null,
    amount: amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null,
    date: dateMatch ? dateMatch[1] : null,
  };
}
