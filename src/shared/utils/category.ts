import type { CategoryId } from '@/features/receipt/api/types/category';

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  bg: string;
  color: string;
}

const CATEGORIES: readonly CategoryInfo[] = [
  { id: 'food', label: '식비', bg: '#FBE6DB', color: '#A45A2A' },
  { id: 'transit', label: '교통', bg: '#E1EEFB', color: '#2B6CA3' },
  { id: 'shop', label: '쇼핑', bg: '#EDE3FA', color: '#6B47A8' },
  { id: 'culture', label: '문화', bg: '#FBF1D2', color: '#9C7A12' },
  { id: 'health', label: '건강', bg: '#DCF3EE', color: '#12786B' },
  { id: 'etc', label: '기타', bg: '#ECEAE6', color: '#6F6D68' },
];

const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(category => [category.id, category]),
) as Record<CategoryId, CategoryInfo>;

const FALLBACK = CATEGORY_MAP.etc;

/**
 * 카테고리 id로 한글 라벨 + 태그 색상(bg/color)을 한 번에 가져옴.
 * 알 수 없는 값이 오면 '기타'로 폴백.
 */
export function getCategoryInfo(id: string): CategoryInfo {
  return CATEGORY_MAP[id as CategoryId] ?? FALLBACK;
}
