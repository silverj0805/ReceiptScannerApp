import { Text } from 'react-native';

import Icon from '@/shared/components/ui/Icon';

type TabIconName = 'home-outline' | 'receipt-outline';

type TabBarIconProps = {
  name: TabIconName;
  focused: boolean;
};

function TabBarIcon({ name, focused }: TabBarIconProps) {
  return (
    <Icon
      name={name}
      size={22}
      colorClassName={focused ? 'accent-primary' : 'accent-gray'}
    />
  );
}

type TabBarLabelProps = {
  label: string;
  focused: boolean;
};
function TabBarLabel({ label, focused }: TabBarLabelProps) {
  return (
    <Text
      className={
        focused
          ? 'text-[12px] font-bold text-primary'
          : 'text-[12px] font-semibold text-gray'
      }
    >
      {label}
    </Text>
  );
}

export const renderHomeIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon name="home-outline" focused={focused} />
);
export const renderHomeLabel = ({ focused }: { focused: boolean }) => (
  <TabBarLabel label="홈" focused={focused} />
);
export const renderReceiptListIcon = ({ focused }: { focused: boolean }) => (
  <TabBarIcon name="receipt-outline" focused={focused} />
);
export const renderReceiptListLabel = ({ focused }: { focused: boolean }) => (
  <TabBarLabel label="내역" focused={focused} />
);
