import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  multiply(a: number, b: number): number;
  scanText(imageUri: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ReceiptScanner');
