/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState } from 'react';
import { Button, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NativeReceiptScanner from '../specs/NativeReceiptScanner';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const result = NativeReceiptScanner.multiply(3, 7);
  const [scanResult, setScanResult] = useState('');

  const scan = async (resourceName: string) => {
    try {
      const text = await NativeReceiptScanner.scanText(
        `android.resource://com.receiptscannerapp/raw/${resourceName}`,
      );
      setScanResult(text);
    } catch (e) {
      setScanResult(`ERROR: ${e}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Result: {result}</Text>
      <View style={styles.buttonRow}>
        <Button title="Scan receipt1" onPress={() => scan('receipt1')} />
        <Button title="Scan receipt2" onPress={() => scan('receipt2')} />
      </View>
      <Text style={styles.scanResult}>{scanResult}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  scanResult: {
    marginTop: 16,
  },
});

export default App;
