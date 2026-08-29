import type { CategoryId } from './category';

export interface ReceiptSummary {
  total: number;
  deltaPercent: number;
  byCategory: CategorySummary[];
}

export interface CategorySummary {
  category: CategoryId;
  amount: number;
  percent: number;
}
