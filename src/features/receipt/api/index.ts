import { createQueryKeys } from '@lukemorales/query-key-factory';

import client from '@/shared/api/client';

import {
  CreateReceiptPayload,
  CreateReceiptResponse,
  Receipt,
} from './types/receipt';
import type { ReceiptSummary } from './types/summary';

export const PAGE_SIZE = 4;

export const receiptRepository = (() => {
  const BASE_URL = '/receipts';

  return {
    getSummary: async () => client.get<ReceiptSummary>(`${BASE_URL}/summary`),

    getList: async ({
      take,
      skip,
      category,
      month,
    }: {
      take: number;
      skip: number;
      category?: string; // 콤마로 구분한 카테고리 id 목록
      month?: string; // YYYY-MM
    }) =>
      client.get<Receipt[]>(BASE_URL, {
        params: { take, skip, category, month },
      }),

    postReceipt: async (payload: CreateReceiptPayload) =>
      client.post<CreateReceiptResponse>(BASE_URL, payload),
  };
})();

export const receiptQueryFactory = createQueryKeys('receipt', {
  summary: () => ({
    queryKey: ['this-month'],
    queryFn: receiptRepository.getSummary,
  }),
  // queryKey만 제공. useInfiniteQuery의 queryFn은 pageParam 제네릭이 필요한데,
  // createQueryKeys가 감싸는 QueryFunction 타입은 TPageParam을 알지 못해
  // 여기서 만들면 pageParam이 unknown으로 좁혀지지 않는다. 그래서 실제 queryFn은
  // useInfiniteQuery 호출부(HomeScreen)에서 직접 정의해서 타입 추론을 살린다.
  list: () => ({
    queryKey: ['list'],
  }),
});
