const path = require('path');

module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['import'],
  settings: {
    // tsconfig.json의 paths(@/* -> ./src/*)를 그대로 읽어서, eslint-plugin-import의
    // 규칙들이 별칭 import도 상대경로 import와 동일하게 인식하도록 연결.
    // project는 cwd가 파일 하위 폴더여도(에디터 ESLint) 찾도록 절대경로로 둔다.
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: path.resolve(__dirname, 'tsconfig.json'),
      },
      // 에디터 ESLint가 typescript resolver를 못 쓸 때 .ts/.tsx 상대경로를 찾도록.
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      },
    },
    // 별칭(@/, @specs/)은 resolver 성공 여부와 무관하게 internal로 분류.
    'import/internal-regex': '^@(?:/|specs/)',
  },
  rules: {
    // 실제로 존재하지 않는 모듈을 import하면 빌드/테스트 전에 lint 단계에서 바로 잡아냄
    'import/no-unresolved': 'error',
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          ['external', 'unknown'],
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          { pattern: '@/**', group: 'internal' },
          { pattern: '@specs/**', group: 'internal' },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        distinctGroup: false,
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  },
  overrides: [
    {
      // jest.setup.js는 테스트 파일 자체가 아니라서 @react-native/eslint-config의
      // jest 플러그인 env가 자동으로 안 붙음 — jest 전역(jest.mock 등)을 직접 허용.
      files: ['jest.setup.js'],
      env: { jest: true },
    },
  ],
};
