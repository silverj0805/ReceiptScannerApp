import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames } from 'uniwind';

import HomeScreen from '@/features/receipt/screens/home';
import ReceiptListScreen from '@/features/receipt/screens/ReceiptListScreen';
import WriteRedirectScreen from '@/features/receipt/screens/WriteRedirectScreen';
import ScanScreen from '@/features/scan/screens/ScanScreen';
import SettingsRedirectScreen from '@/features/settings/screens/SettingsRedirectScreen';

import ScanTabButton from './tabBars/ScanTabButton';
import SettingsTabButton from './tabBars/SettingsTabButton';
import {
  renderHomeIcon,
  renderHomeLabel,
  renderReceiptListIcon,
  renderReceiptListLabel,
  renderSettingsIcon,
  renderSettingsLabel,
  renderWriteIcon,
  renderWriteLabel,
} from './tabBars/TabBarIcon';
import WriteTabButton from './tabBars/WriteTabButton';
import type { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarTokenStyle = useResolveClassNames(
    'bg-white border-t border-[#e8e6e1]',
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...tabBarTokenStyle,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          tabBarIcon: renderHomeIcon,
          tabBarLabel: renderHomeLabel,
        }}
      />
      <Tab.Screen
        name="Write"
        component={WriteRedirectScreen}
        options={{
          title: '기록',
          tabBarIcon: renderWriteIcon,
          tabBarLabel: renderWriteLabel,
          tabBarButton: WriteTabButton,
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          title: '스캔',
          tabBarButton: ScanTabButton,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="ReceiptList"
        component={ReceiptListScreen}
        options={{
          title: '내역',
          tabBarIcon: renderReceiptListIcon,
          tabBarLabel: renderReceiptListLabel,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsRedirectScreen}
        options={{
          title: '설정',
          tabBarIcon: renderSettingsIcon,
          tabBarLabel: renderSettingsLabel,
          tabBarButton: SettingsTabButton,
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
