import dayjs from 'dayjs';
import { Text, View } from 'react-native';

import { CategoryId } from '@/features/receipt/api/types/category';
import { Box } from '@/shared/components/ui/Box';
import { getCategoryInfo } from '@/shared/utils/category';

interface ReceiptItemProps {
  title: string;
  category: CategoryId;
  date: string;
  amount: number;
}

const ReceiptItem = ({ title, category, date, amount }: ReceiptItemProps) => {
  return (
    <Box className="flex-row items-center justify-between">
      <View className="gap-2">
        <Text className="text-lg font-bold">{title}</Text>
        <View className="flex-row items-center gap-1">
          <View
            className="py-0.5 px-2 rounded-lg"
            style={{ backgroundColor: getCategoryInfo(category).bg }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: getCategoryInfo(category).color }}
            >
              {getCategoryInfo(category).label}
            </Text>
          </View>
          <Text className="text-sm text-gray">
            {dayjs(date).format('M월 D일')}
          </Text>
        </View>
      </View>
      <Text className="text-lg font-bold">
        ₩{amount.toLocaleString('ko-KR')}
      </Text>
    </Box>
  );
};

export default ReceiptItem;
