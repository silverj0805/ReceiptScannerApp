/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState } from 'react';
import { Button, Image, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NativeReceiptScanner from '../specs/NativeReceiptScanner';

// require()는 정적 문자열만 허용돼서 미리 맵으로 준비해둠.
// Image.resolveAssetSource(...)는 두 플랫폼 모두에서 scanText가 바로 쓸 수 있는
// URI를 돌려줌 — Android의 android.resource://, iOS의 번들 리소스 접근을
// 각 네이티브 코드가 알아서 처리해줄 필요 없이, RN의 표준 에셋 파이프라인 하나로 통일.
const exampleReceipts: Record<string, number> = {
  receipt1: require('./assets/examples/receipt1.jpeg'),
  receipt2: require('./assets/examples/receipt2.jpeg'),
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const result = NativeReceiptScanner.multiply(3, 7);
  const [scanResult, setScanResult] = useState('');

  const scan = async (resourceName: string) => {
    try {
      const asset = Image.resolveAssetSource(exampleReceipts[resourceName]);
      if (!asset) {
        throw new Error(`Unknown example receipt: ${resourceName}`);
      }
      const text = await NativeReceiptScanner.scanText(asset.uri);
      setScanResult(text);
    } catch (e) {
      setScanResult(`ERROR: ${e}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Result: {result}</Text>
      <View style={styles.buttonRow}>
        <Button title="Scan receipt1" onPress={() => scan('receipt1')} />
        <Button title="Scan receipt2" onPress={() => scan('receipt2')} />
      </View>
      <Text style={styles.scanResult}>{scanResult}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  scanResult: {
    marginTop: 16,
  },
});

export default App;
