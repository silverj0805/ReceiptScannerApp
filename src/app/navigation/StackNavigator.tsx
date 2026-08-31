import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ConfirmScreen from '@/features/confirm/screens/ConfirmScreen';
import ReceiptDetailScreen from '@/features/receipt/screens/ReceiptDetailScreen';
import LicenseScreen from '@/features/settings/screens/license';
import WebViewScreen from '@/features/settings/screens/policy/WebViewScreen';
import SettingsScreen from '@/features/settings/screens/settings';

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
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="License" component={LicenseScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
}
