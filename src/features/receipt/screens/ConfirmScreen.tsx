import { RouteProp, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '@/app/navigation/types';

// placeholder — OCR 결과 편집/카테고리 선택 등 실제 확인 화면 UI는 이 화면을
// 본격적으로 만드는 태스크에서 채운다. 지금은 Capture에서 넘긴 파라미터가
// 정상적으로 전달되는지만 확인.
export function ConfirmScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Confirm'>>();

  return (
    <View style={styles.container}>
      <Text>확인 화면 (placeholder)</Text>
      <Text>imageUri: {route.params.imageUri}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
