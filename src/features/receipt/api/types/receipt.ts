import type { CategoryId } from './category';

export interface Receipt {
  id: number;
  merchant: string;
  itemName?: string;
  amount: number;
  category: CategoryId;
  rawText?: string;
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface CreateReceiptPayload {
  merchant: string;
  itemName?: string;
  amount: number;
  category: CategoryId;
  rawText?: string;
  date: string; // YYYY-MM-DD
}

// date/createdAt은 서버가 전체 ISO datetime으로 내려줌
// (요청 바디의 date는 YYYY-MM-DD만 보내면 됨 — 서버가 자정 timestamp로 채워서 돌려줌).
export interface CreateReceiptResponse {
  id: number;
  deviceId: string;
  merchant: string;
  itemName?: string;
  amount: number;
  category: CategoryId;
  rawText?: string;
  date: string;
  createdAt: string;
}
