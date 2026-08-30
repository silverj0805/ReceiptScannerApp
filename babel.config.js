module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@specs': './specs',
        },
      },
    ],
    // react-native-reanimated(react-native-keyboard-controller가 요구하는 peer dep)의
    // worklet 변환 플러그인. 공식 문서 기준 반드시 plugins 배열의 마지막이어야 함.
    'react-native-worklets/plugin',
  ],
};
