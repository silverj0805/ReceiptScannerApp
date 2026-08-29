import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '@/app/navigation/types';

// placeholder — 실제 카메라 UI/퍼미션/촬영 로직은 이 화면을 본격적으로 만드는
// 태스크에서 채운다. 지금은 루트 스택의 Confirm으로 실제 push가 되는지만 확인.
export function CaptureScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text>카메라 화면 (placeholder)</Text>
      <Button
        title="스캔 완료 → 확인 화면으로"
        onPress={() => navigation.navigate('Confirm', { imageUri: 'dummy-image-uri' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
