// 백엔드 receipts 라우터(POST/GET /receipts, GET /receipts/summary) 스키마 기준.
// category는 한글이 아니라 영문 enum으로 내려옴 — 화면에 보여줄 한글 라벨은 별도 매핑이 필요함

export type ReceiptCategory =
  | 'food'
  | 'transit'
  | 'shop'
  | 'culture'
  | 'health'
  | 'etc';

export interface Receipt {
  id: number;
  merchant: string;
  itemName?: string;
  amount: number;
  category: ReceiptCategory;
  rawText?: string;
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface CategorySummary {
  category: ReceiptCategory;
  amount: number;
  percent: number;
}

// GET /receipts/summary 응답 — 영수증 리스트 자체는 안 내려주고 집계만 줌.
// "최근 영수증" 리스트는 GET /receipts를 별도로 호출해서 받아야 함.
export interface ReceiptSummary {
  total: number;
  deltaPercent: number;
  byCategory: CategorySummary[];
}
