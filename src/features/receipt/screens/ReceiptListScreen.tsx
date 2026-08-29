import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '@/app/navigation/types';

// placeholder — 실제 영수증 목록 UI/API 연동은 이 화면을 본격적으로 만드는
// 태스크에서 채운다. 지금은 리스트 아이템 탭 → 루트 스택의 Detail로 실제
// push가 되는지만 확인.
export function ReceiptListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text>내역 화면 (placeholder)</Text>
      <Button
        title="영수증 상세보기"
        onPress={() => navigation.navigate('Detail', { receiptId: 'dummy-receipt-id' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
