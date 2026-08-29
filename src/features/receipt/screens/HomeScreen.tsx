import { useState } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import NativeReceiptScanner from '../../../../specs/NativeReceiptScanner';

// require()는 정적 문자열만 허용돼서 미리 맵으로 준비해둠.
const exampleReceipts: Record<string, number> = {
  receipt1: require('../../../assets/examples/receipt1.jpeg'),
  receipt2: require('../../../assets/examples/receipt2.jpeg'),
};

// placeholder — 실제 홈 대시보드 UI(이번 달 지출 요약 등)는 이 화면을 본격적으로
// 만드는 태스크에서 채운다. scanText 네이티브 모듈 검증용으로 쓰던 버튼을 당분간
// 여기 임시로 옮겨둠(그 태스크에서 정식 UI로 교체될 때 같이 정리 예정).
export function HomeScreen() {
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
      <Text>홈 화면 (placeholder)</Text>
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
