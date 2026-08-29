import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@/app/navigation/types';
import Icon from '@/shared/ui/Icon';

function ScanScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const close = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={close}
        hitSlop={12}
        style={[styles.closeButton, { top: insets.top + 12 }]}
      >
        <Icon name="close-outline" size={28} colorClassName="accent-black" />
      </Pressable>

      <Text>카메라 화면 (placeholder)</Text>
      <Button
        title="스캔 완료 → 확인 화면으로"
        onPress={() =>
          navigation.navigate('Stacks', {
            screen: 'Confirm',
            params: { imageUri: 'dummy-image-uri' },
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
  closeButton: {
    position: 'absolute',
    left: 16,
  },
});

export default ScanScreen;
