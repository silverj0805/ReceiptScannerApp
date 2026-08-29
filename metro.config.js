const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

// withUniwindConfig는 항상 가장 바깥쪽 wrapper여야 함(uniwind 공식 문서 명시 사항).
module.exports = withUniwindConfig(mergeConfig(getDefaultConfig(__dirname), config), {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
