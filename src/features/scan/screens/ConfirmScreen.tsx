import { RouteProp, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import type { StackParamList } from '@/app/navigation/types';

function ConfirmScreen() {
  const route = useRoute<RouteProp<StackParamList, 'Confirm'>>();

  return (
    <View style={styles.container}>
      <Text>확인 화면 (placeholder)</Text>
      <Text>imageUri: {route.params.imageUri}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default ConfirmScreen;
