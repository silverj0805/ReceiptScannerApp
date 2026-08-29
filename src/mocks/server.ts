import { setupServer } from 'msw/node';

import { handlers } from './handlers';

// Jest는 Node 환경에서 컴포넌트를 렌더링해 테스트하므로(디바이스 위가 아님), MSW 공식
// React Native 가이드도 이 경우엔 msw/native가 아니라 일반 Node.js 통합(msw/node)을
// 따르라고 안내함.
export const server = setupServer(...handlers);
