import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '@/app/navigation/types';

function ReceiptListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text>내역 화면 (placeholder)</Text>
      <Button
        title="영수증 상세보기"
        onPress={() =>
          navigation.navigate('Stacks', {
            screen: 'Detail',
            params: { receiptId: 'dummy-receipt-id' },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});

export default ReceiptListScreen;
