import dayjs from 'dayjs';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import SummaryCard, { SummaryCardProps } from '../summaryCard';
import SummaryCardSkeleton from '../summaryCard/SummaryCardSkeleton';

interface ListHeaderComponentProps {
  isLoading: boolean;
  summary?: SummaryCardProps;
  onPress: () => void;
}

const ListHeaderComponent = ({
  isLoading,
  summary,
  onPress,
}: ListHeaderComponentProps) => (
  <View className="gap-5">
    <View className="gap-1">
      <Text className="text-2xl font-bold">가계부</Text>
      <Text className="text-sm text-gray">{dayjs().format('YYYY.MM.DD')}</Text>
    </View>
    {isLoading || !summary ? (
      <SummaryCardSkeleton />
    ) : (
      <SummaryCard {...summary} />
    )}
    <View className="flex-row items-center justify-between">
      <Text className="text-base font-bold">최근 영수증</Text>
      <Pressable onPress={onPress}>
        <Text className="text-base font-bold text-primary">전체 보기</Text>
      </Pressable>
    </View>
  </View>
);

export default ListHeaderComponent;
