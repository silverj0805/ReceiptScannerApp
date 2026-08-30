import { Text, View } from 'react-native';

import type { CategorySummary } from '@/features/receipt/api/types/summary';
import { Box } from '@/shared/components/ui/Box';
import { getCategoryInfo } from '@/shared/utils/category';

export interface SummaryCardProps {
  total: number;
  deltaPercent: number;
  byCategory: CategorySummary[];
}

function SummaryCard({ total, deltaPercent, byCategory }: SummaryCardProps) {
  return (
    <Box className="w-full gap-3.5">
      <View className="gap-1.5">
        <Text className="font-bold text-gray">이번 달 지출 💸</Text>
        <View className="flex-row items-baseline gap-2">
          <Text className="text-[32px] font-extrabold tracking-[-0.5px] text-black tabular-nums">
            ₩{total.toLocaleString('ko-KR')}
          </Text>
          {deltaPercent !== 0 && (
            <Text
              className={`rounded-full px-2 py-0.75 text-xs font-bold ${
                deltaPercent < 0
                  ? 'bg-[#e3eee8] text-primary'
                  : 'bg-[#ffe3e3] text-[#dc2626]'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  deltaPercent < 0
                    ? 'bg-[#e3eee8] text-primary'
                    : 'bg-[#ffe3e3] text-[#dc2626]'
                }`}
              >
                지난 달 대비{' '}
              </Text>
              {deltaPercent > 0 ? '+' : ''}
              {deltaPercent}%
            </Text>
          )}
        </View>
      </View>

      {byCategory.length > 0 && (
        <>
          <View className="h-2 flex-row overflow-hidden rounded-full bg-[#eeeeee]">
            {byCategory.map(({ category, percent }) => (
              <View
                key={category}
                className="h-full"
                style={{
                  width: `${percent}%`,
                  backgroundColor: getCategoryInfo(category).color,
                }}
              />
            ))}
          </View>

          <View className="flex-row flex-wrap gap-x-3.5 gap-y-2">
            {byCategory.map(({ category, percent }) => {
              const info = getCategoryInfo(category);
              return (
                <View key={category} className="flex-row items-center gap-1.5">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  <Text className="text-xs text-gray font-semibold">
                    {info.label} {percent}%
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Box>
  );
}

export default SummaryCard;
