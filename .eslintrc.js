module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['import'],
  settings: {
    // tsconfig.json의 paths(@/* -> ./src/*)를 그대로 읽어서, eslint-plugin-import의
    // 규칙들이 별칭 import도 상대경로 import와 동일하게 인식하도록 연결.
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // 실제로 존재하지 않는 모듈을 import하면 빌드/테스트 전에 lint 단계에서 바로 잡아냄
    'import/no-unresolved': 'error',
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
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
