import type { HttpHandler } from 'msw';

// 각 화면을 TDD로 개발할 때, 그 화면이 실제로 호출하는 API에 맞춰 여기에 핸들러를
// 추가해나간다(예: http.get('*/receipts', () => HttpResponse.json([...]))).
// 지금은 아직 실제 API 연동이 없는 스켈레톤 단계라 빈 배열.
export const handlers: HttpHandler[] = [];
