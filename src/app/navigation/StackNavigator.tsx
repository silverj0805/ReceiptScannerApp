import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ReceiptDetailScreen from '@/features/receipt/screens/ReceiptDetailScreen';
import ConfirmScreen from '@/features/scan/screens/ConfirmScreen';

import type { StackParamList } from './types';

const Stack = createNativeStackNavigator<StackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Confirm" component={ConfirmScreen} />
      <Stack.Screen name="Detail" component={ReceiptDetailScreen} />
    </Stack.Navigator>
  );
}
