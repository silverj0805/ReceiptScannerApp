import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  type CompositeNavigationProp,
  useFocusEffect,
  useScrollToTop,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import type {
  BottomTabParamList,
  RootStackParamList,
} from '@/app/navigation/types';
import { receiptQueryFactory, receiptRepository } from '@/features/receipt/api';

import EmptyReceipt from '../../components/home/recentReceipts/EmptyReceipt';
import HomeReceiptRow from '../../components/home/recentReceipts/HomeReceiptRow';
import {
  isSkeletonRow,
  SKELETON_ROWS,
  type HomeRow,
} from '../../components/home/recentReceipts/homeRows';
import ListHeaderComponent from '../../components/home/recentReceipts/ListHeaderComponent';

const PAGE_SIZE = 4;

const ItemSeparatorComponent = () => <View className="h-4" />;

type HomeNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function HomeScreen({ navigation }: { navigation: HomeNavigation }) {
  const backgroundColor = useCSSVariable('--color-background');
  const primaryColor = useCSSVariable('--color-primary');

  const scrollRef = useRef<FlatList<HomeRow> | null>(null);
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
    placeholderData: keepPreviousData,
  });
  const receipts = listQuery.data?.pages.flatMap(page => page.data) ?? [];

  // 로딩 중엔 실데이터 대신 스켈레톤 행을 data로 흘려서 FlatList가 그대로 렌더링하게 함.
  const rows: HomeRow[] = listQuery.isLoading ? SKELETON_ROWS : receipts;

  const keyExtractor = useCallback((row: HomeRow) => {
    return isSkeletonRow(row)
      ? `skeleton-${row.skeletonKey}`
      : row.id.toString();
  }, []);

  /**
   * 다른 화면(스캔/수정/삭제)에서 생긴 변경이 invalidateQueries 없이도
   * 확실히 반영되도록, Home이 실제로 포커스될 때마다 직접 refetch한다
   */
  useFocusEffect(
    useCallback(() => {
      summaryQuery.refetch();
      listQuery.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleEndReached = () => {
    if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      listQuery.fetchNextPage();
    }
  };

  const goToDetail = (id: number) =>
    navigation.navigate('Stacks', {
      screen: 'Detail',
      params: { receiptId: String(id) },
    });

  const goToReceiptList = () => navigation.navigate('ReceiptList');

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
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <HomeReceiptRow row={item} onPress={goToDetail} />
        )}
        ListHeaderComponent={
          <ListHeaderComponent
            isLoading={summaryQuery.isLoading}
            summary={summaryQuery.data}
            onPress={goToReceiptList}
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
        onEndReachedThreshold={0.7}
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
