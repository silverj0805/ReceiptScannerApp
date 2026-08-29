import { useScrollToTop } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import type { BottomTabParamList } from '@/app/navigation/types';
import type { Receipt } from '@/features/receipt/api/types/receipt';
import EmptyReceipt from '@/features/receipt/components/EmptyReceipt';
import ReceiptItem from '@/features/receipt/components/recentReceipts/ReceiptItem';
import ReceiptItemSkeleton from '@/features/receipt/components/recentReceipts/ReceiptItemSkeleton';

import { PAGE_SIZE, receiptQueryFactory, receiptRepository } from '../../api';
import ListHeaderComponent from '../../components/recentReceipts/ListHeaderComponent';

const SKELETON_ROW_COUNT = 4;
const SKELETON_ROWS = Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => ({
  skeletonKey: i,
}));
type SkeletonRow = { skeletonKey: number };
type ListRow = Receipt | SkeletonRow;
const isSkeletonRow = (row: ListRow): row is SkeletonRow =>
  'skeletonKey' in row;

const ItemSeparatorComponent = () => <View className="h-4" />;

function HomeScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<BottomTabParamList>;
}) {
  const backgroundColor = useCSSVariable('--color-background');
  const primaryColor = useCSSVariable('--color-primary');
  const scrollRef = useRef<FlatList<ListRow> | null>(null);
  useScrollToTop(scrollRef);

  const summaryQuery = useQuery({
    ...receiptQueryFactory.summary(),
    select: res => res.data,
  });

  const listQuery = useInfiniteQuery({
    queryKey: receiptQueryFactory.list().queryKey,
    queryFn: ({ pageParam }) =>
      receiptRepository.getList({ take: PAGE_SIZE, skip: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.data.length < PAGE_SIZE
        ? undefined
        : allPages.length * PAGE_SIZE,
  });
  const receipts = listQuery.data?.pages.flatMap(page => page.data) ?? [];

  // 로딩 중엔 실데이터 대신 스켈레톤 행을 data로 흘려서 FlatList가 그대로 렌더링하게 함.
  const rows: ListRow[] = listQuery.isLoading ? SKELETON_ROWS : receipts;

  const handleEndReached = () => {
    if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      listQuery.fetchNextPage();
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([summaryQuery.refetch(), listQuery.refetch()]).finally(
      () => {
        setRefreshing(false);
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor }}>
      <FlatList
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="bg-background grow py-4 px-5 pb-10"
        ListHeaderComponentClassName="pb-5"
        data={rows}
        keyExtractor={row =>
          isSkeletonRow(row) ? `skeleton-${row.skeletonKey}` : row.id.toString()
        }
        renderItem={({ item }) =>
          isSkeletonRow(item) ? (
            <ReceiptItemSkeleton />
          ) : (
            <ReceiptItem
              title={item.merchant}
              category={item.category}
              date={item.date}
              amount={item.amount}
            />
          )
        }
        ListHeaderComponent={
          <ListHeaderComponent
            isLoading={summaryQuery.isLoading}
            summary={summaryQuery.data}
            onPress={() => navigation.navigate('ReceiptList')}
          />
        }
        ItemSeparatorComponent={ItemSeparatorComponent}
        ListEmptyComponent={EmptyReceipt}
        ListFooterComponent={
          listQuery.isFetchingNextPage ? (
            <ActivityIndicator color={primaryColor} size="small" />
          ) : undefined
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshControl={
          <RefreshControl
            testID="home-loading"
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
      />
    </SafeAreaView>
  );
}

export default HomeScreen;
