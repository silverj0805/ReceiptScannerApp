import { RouteProp, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '@/app/navigation/types';

// placeholder — 실제 영수증 상세 UI/API 연동은 이 화면을 본격적으로 만드는
// 태스크에서 채운다. 지금은 List에서 넘긴 파라미터가 정상적으로 전달되는지만 확인.
export function ReceiptDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Detail'>>();

  return (
    <View style={styles.container}>
      <Text>상세 화면 (placeholder)</Text>
      <Text>receiptId: {route.params.receiptId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
