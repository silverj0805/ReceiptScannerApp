import { useNavigation, useScrollToTop } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import type { RootStackParamList } from '@/app/navigation/types';
import Icon from '@/shared/components/ui/Icon';
import { CATEGORY_IDS, getCategoryInfo } from '@/shared/utils/category';

import { receiptQueryFactory, receiptRepository } from '../api';
import type { CategoryId } from '../api/types/category';
import { groupReceiptsByDate, ReceiptGroup } from '../utils/groupByDate';
import type { PeriodFilter } from '../utils/receiptFilters';
import { categoriesToParam, periodToMonthParam } from '../utils/receiptFilters';

const PAGE_SIZE = 10;

const PERIOD_TABS: { id: PeriodFilter; label: string }[] = [
  { id: 'month', label: '이번 달' },
  { id: 'last', label: '지난 달' },
  { id: 'all', label: '전체' },
];

// 카테고리 칩 목록 — 맨 앞의 '전체'는 선택 해제(필터 없음)를 뜻하는 특수 값이라
// CategoryId가 아닌 별도 리터럴로 다룬다.
const CATEGORY_CHIPS: Array<{ id: 'all' | CategoryId }> = [
  { id: 'all' },
  ...CATEGORY_IDS.map(id => ({ id })),
];

function ReceiptListScreen() {
  const backgroundColor = useCSSVariable('--color-background');
  const primaryColor = useCSSVariable('--color-primary');

  const scrollRef = useRef<FlatList<ReceiptGroup> | null>(null);
  useScrollToTop(scrollRef);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [period, setPeriod] = useState<PeriodFilter>('month');
  // 빈 배열 = "전체" 카테고리(필터 없음).
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    [],
  );

  const toggleCategory = (id: CategoryId) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  };
  const selectAllCategories = () => setSelectedCategories([]);

  const month = periodToMonthParam(period);
  const category = categoriesToParam(selectedCategories, CATEGORY_IDS);

  const listQuery = useInfiniteQuery({
    // period/category가 바뀌면 새 쿼리(=1페이지부터 다시)로 취급되게 키에 포함.
    // 선택 순서에 상관없이 같은 키가 나오도록 정렬해서 넣는다.
    queryKey: [
      ...receiptQueryFactory.list().queryKey,
      'filtered',
      period,
      [...selectedCategories].sort(),
    ],
    queryFn: ({ pageParam }) =>
      receiptRepository.getList({
        take: PAGE_SIZE,
        skip: pageParam,
        category,
        month,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.data.length < PAGE_SIZE
        ? undefined
        : allPages.length * PAGE_SIZE,
    // period/category를 바꿀 때마다 쿼리 키가 바뀌어 매번 "새 쿼리"로 취급되는데,
    // placeholderData 없이는 그때마다 화면 전체가 로딩 화면으로 바뀌면서 필터 UI 자체가
    // 사라져버린다 — 이전 데이터를 유지한 채로 백그라운드에서 갈아끼우게 해서 방지.
    placeholderData: keepPreviousData,
  });

  const receipts = listQuery.data?.pages.flatMap(page => page.data) ?? [];
  const groups = groupReceiptsByDate(receipts);

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

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await listQuery.refetch().finally(() => {
      setRefreshing(false);
    });
  };

  if (listQuery.isLoading) {
    return (
      <View
        testID="receipt-list-loading"
        className="flex-1 items-center justify-center bg-background"
      >
        <ActivityIndicator color="#1B5E43" />
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor }}
      className="bg-background"
    >
      <View className="gap-3 px-5 pb-2 pt-4 mb-5">
        <Text className="text-xl font-extrabold text-black">전체 내역</Text>

        {/* 기간 — 배타적 단일 선택 */}
        <View className="flex-row rounded-xl border border-[#e8e6e1] bg-white p-1">
          {PERIOD_TABS.map(tab => {
            const selected = tab.id === period;
            return (
              <Pressable
                key={tab.id}
                testID={`period-${tab.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPeriod(tab.id)}
                className={`flex-1 items-center rounded-lg py-2 ${
                  selected ? 'bg-background' : ''
                }`}
              >
                <Text
                  className={`text-[13px] font-bold ${
                    selected ? 'text-primary' : 'text-gray'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 카테고리 — 다중 선택(전체는 선택 해제와 동일) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {CATEGORY_CHIPS.map(({ id }) => {
              const info = id === 'all' ? null : getCategoryInfo(id);
              const label = id === 'all' ? '전체' : info!.label;
              const selected =
                id === 'all'
                  ? selectedCategories.length === 0
                  : selectedCategories.includes(id);
              const activeBg = info?.bg ?? '#1C1B1A';
              const activeColor = info?.color ?? '#FFFFFF';

              return (
                <Pressable
                  key={id}
                  testID={`category-filter-${id}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() =>
                    id === 'all' ? selectAllCategories() : toggleCategory(id)
                  }
                  className="rounded-full px-3.5 py-2"
                  style={{
                    backgroundColor: selected ? activeBg : '#ffffff',
                    borderWidth: 1,
                    borderColor: selected ? activeColor : '#e8e6e1',
                  }}
                >
                  <Text
                    className="text-[13px] font-bold"
                    style={{ color: selected ? activeColor : '#6f6d68' }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <FlatList
        testID="receipt-list"
        showsVerticalScrollIndicator={false}
        ref={scrollRef}
        data={groups}
        keyExtractor={group => group.date}
        contentContainerClassName="grow gap-4 px-5 pb-10"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.7}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-3 py-20">
            <Icon
              name="search-outline"
              size={44}
              colorClassName="accent-gray"
            />
            <Text className="text-sm font-bold text-gray">
              조건에 맞는 영수증이 없어요
            </Text>
          </View>
        }
        ListFooterComponent={
          listQuery.isFetchingNextPage ? (
            <ActivityIndicator color="#1B5E43" />
          ) : undefined
        }
        renderItem={({ item: group }) => (
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-0.5">
              <Text className="text-xs font-bold text-gray">
                {dayjs(group.date).locale('ko').format('M월 D일 dddd')}
              </Text>
              <Text className="text-xs font-bold text-gray">
                ₩{group.total.toLocaleString('ko-KR')}
              </Text>
            </View>
            <View className="gap-2">
              {group.items.map(item => {
                const info = getCategoryInfo(item.category);
                return (
                  <Pressable
                    key={item.id}
                    testID={`receipt-item-${item.id}`}
                    onPress={() => goToDetail(item.id)}
                    className="flex-row items-center justify-between rounded-2xl border border-[#e8e6e1] bg-white px-3.5 py-3"
                  >
                    <View className="flex-row items-center gap-2.5">
                      <View
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <View className="gap-0.5">
                        <Text className="text-[13px] font-bold text-black">
                          {item.merchant}
                        </Text>
                        <Text className="text-[11px] text-gray">
                          {info.label}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-extrabold text-black">
                      ₩{item.amount.toLocaleString('ko-KR')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl
            testID="receipt-list-loading"
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
          />
        }
      />
    </SafeAreaView>
  );
}

export default ReceiptListScreen;
