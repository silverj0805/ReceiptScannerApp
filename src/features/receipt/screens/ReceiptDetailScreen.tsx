import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { StackParamList } from '@/app/navigation/types';
import { receiptQueryFactory } from '@/features/receipt/api';
import Icon from '@/shared/components/ui/Icon';
import { getCategoryInfo } from '@/shared/utils/category';

function ReceiptDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<StackParamList, 'Detail'>>();
  const { receiptId } = route.params;

  // 인식된 원문은 상세 화면에선 기본적으로 펼쳐서 바로 보여줌(목업 기본값과 동일).
  const [showRaw, setShowRaw] = useState(true);

  const detailQuery = useQuery(receiptQueryFactory.detail(receiptId));

  const goBack = () => navigation.goBack();

  if (detailQuery.isLoading) {
    return (
      <View
        testID="receipt-detail-loading"
        className="flex-1 items-center justify-center bg-background"
      >
        <ActivityIndicator color="#1B5E43" />
      </View>
    );
  }

  if (detailQuery.isError) {
    const isNotFound =
      axios.isAxiosError(detailQuery.error) &&
      detailQuery.error.response?.status === 404;

    return (
      <View className="flex-1 items-center justify-center gap-4.5 bg-background px-8">
        <Icon
          name="document-text-outline"
          size={72}
          colorClassName="accent-primary"
        />
        <Text className="text-center text-[13px] leading-5 text-gray">
          {isNotFound
            ? '영수증을 찾을 수 없어요'
            : '영수증을 불러오지 못했어요. 다시 시도해주세요.'}
        </Text>
        <Pressable
          onPress={goBack}
          className="rounded-2xl border border-[#e8e6e1] bg-white px-5.5 py-3.5"
        >
          <Text className="text-sm font-bold text-black">돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  if (!detailQuery.data) {
    // isLoading/isError를 이미 처리했으니 실제로는 도달하지 않음 — TS 좁히기용 가드.
    return null;
  }

  const receipt = detailQuery.data.data;
  const info = getCategoryInfo(receipt.category);

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1 }}
      className="bg-background"
    >
      <View className="flex-row items-center justify-between p-5">
        <Pressable testID="detail-back-button" onPress={goBack} hitSlop={8}>
          <Icon name="chevron-back" size={22} colorClassName="accent-black" />
        </Pressable>
        <Text className="text-[15px] font-bold text-black">영수증 상세</Text>
        <View className="w-5.5" />
      </View>

      <ScrollView contentContainerClassName="gap-3.5 px-5 pb-5">
        {/* 영수증 정보 */}
        <View className="gap-2.5 rounded-2xl border border-[#e8e6e1] bg-white p-4.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-black">
              가맹점 : {receipt.merchant}
            </Text>
            <View
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: info.bg }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: info.color }}
              >
                {info.label}
              </Text>
            </View>
          </View>
          {receipt?.itemName && (
            <Text className="text-base font-bold text-black">
              품 명 : {receipt.itemName}
            </Text>
          )}
          <Text className="text-[28px] font-extrabold text-black">
            ₩{receipt.amount.toLocaleString('ko-KR')}
          </Text>
          <Text className="text-[13px] text-gray">
            {dayjs(receipt.date).locale('ko').format('YYYY.MM.DD (ddd)')}
          </Text>
        </View>

        {/* 인식된 원문 — 없으면 섹션 자체를 안 보여줌 */}
        {receipt.rawText && (
          <View className="overflow-hidden rounded-2xl border border-[#e8e6e1] bg-white">
            <Pressable
              onPress={() => setShowRaw(prev => !prev)}
              className="flex-row items-center justify-between px-3.5 py-3"
            >
              <Text className="text-[13px] font-bold text-black">
                인식된 원문
              </Text>
              <Icon
                name={showRaw ? 'chevron-up' : 'chevron-down'}
                size={16}
                colorClassName="accent-gray"
              />
            </Pressable>
            {showRaw && (
              <View className="mx-3.5 mb-3.5 rounded-[10px] bg-[#f1f0ec] px-3 py-2.5">
                <Text className="text-[11px] leading-[1.7] text-gray">
                  {receipt.rawText}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 수정/삭제 — API 스펙이 아직 없어서 UI만 배치, 동작은 추후 연결 */}
      <View className="flex-row gap-2.5 border-t border-[#e8e6e1] bg-background px-5 pb-7 pt-4">
        <View className="flex-1 items-center rounded-2xl border border-[#e8e6e1] bg-white py-3.5">
          <Text className="text-sm font-bold text-black">수정</Text>
        </View>
        <View className="flex-1 items-center rounded-2xl border border-[#e7c8c5] bg-white py-3.5">
          <Text className="text-sm font-bold text-[#B3261E]">삭제</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ReceiptDetailScreen;
