import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ReceiptDetailScreen from '@/features/receipt/screens/ReceiptDetailScreen';
import ConfirmScreen from '@/features/scan/screens/ConfirmScreen';
import LicenseScreen from '@/features/settings/screens/LicenseScreen';
import SettingsScreen from '@/features/settings/screens/SettingsScreen';
import WebViewScreen from '@/features/settings/screens/WebViewScreen';

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
