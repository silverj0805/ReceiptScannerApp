import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ConfirmScreen } from '@/features/receipt/screens/ConfirmScreen';
import { ReceiptDetailScreen } from '@/features/receipt/screens/ReceiptDetailScreen';

import { BottomTabNavigator } from './BottomTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Detail" component={ReceiptDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
