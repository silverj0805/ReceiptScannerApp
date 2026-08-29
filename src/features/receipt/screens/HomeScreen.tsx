import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { useState } from 'react';
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Box } from '@/shared/ui/Box';
import NativeReceiptScanner from '@specs/NativeReceiptScanner';

// require()는 정적 문자열만 허용돼서 미리 맵으로 준비해둠.
const exampleReceipts: Record<string, number> = {
  receipt1: require('@/assets/examples/receipt1.jpeg'),
  receipt2: require('@/assets/examples/receipt2.jpeg'),
};

function HomeScreen() {
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
    <ScrollView
      className="bg-background"
      contentContainerStyle={styles.container}
    >
      {/* Ionicons 폰트 링킹 확인용 — 실제 탭 아이콘 적용은 하단 탭 UI 고도화 태스크에서 진행 */}
      <Ionicons name="home-outline" size={28} color="#1B5E43" />
      <Text className="text-primary">홈 화면 (placeholder)</Text>
      {/* uniwind 공통 스타일 토큰(Box) 확인용 — 실제 UI는 홈 화면 태스크에서 교체 */}
      <Box className="mt-4">
        <View style={styles.buttonRow}>
          <Button title="Scan receipt1" onPress={() => scan('receipt1')} />
          <Button title="Scan receipt2" onPress={() => scan('receipt2')} />
        </View>
        <Text style={styles.scanResult}>{scanResult}</Text>
      </Box>
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

export default HomeScreen;
