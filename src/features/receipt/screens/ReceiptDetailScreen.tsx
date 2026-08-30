import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import type { StackParamList } from '@/app/navigation/types';
import { receiptQueryFactory, receiptRepository } from '@/features/receipt/api';
import Icon from '@/shared/components/ui/Icon';
import { getCategoryInfo } from '@/shared/utils/category';

function ReceiptDetailScreen() {
  const queryClient = useQueryClient();
  const backgroundColor = useCSSVariable('--color-background');

  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const route = useRoute<RouteProp<StackParamList, 'Detail'>>();
  const { receiptId } = route.params;

  // 인식된 원문은 상세 화면에선 기본적으로 펼쳐서 바로 보여줌(목업 기본값과 동일).
  const [showRaw, setShowRaw] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const detailQuery = useQuery(receiptQueryFactory.detail(receiptId));

  const goBack = () => navigation.goBack();

  const deleteMutation = useMutation({
    mutationFn: () => receiptRepository.deleteReceipt(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: receiptQueryFactory.list().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: receiptQueryFactory.summary().queryKey,
      });
      navigation.goBack();
    },
    onError: () => {
      setDeleteError('삭제에 실패했어요. 다시 시도해주세요.');
    },
  });

  const confirmDelete = () => {
    setDeleteError(null);
    Alert.alert('영수증을 삭제할까요?', '삭제하면 다시 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

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
  const goToEdit = () => navigation.navigate('Confirm', { info: receipt });

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor }}
    >
      <View className="flex-row items-center justify-between p-5">
        <Pressable testID="detail-back-button" onPress={goBack} hitSlop={8}>
          <Icon name="chevron-back" size={22} colorClassName="accent-black" />
        </Pressable>
        <Text className="text-[15px] font-bold text-black">영수증 상세</Text>
        <View className="w-5.5" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-3.5 px-5 pb-5"
      >
        {/* 영수증 정보 */}
        <View className="gap-2.5 rounded-2xl border border-[#e8e6e1] bg-white p-4.5">
          <View className="flex-row items-center justify-between">
            <Text
              testID="detail-merchant"
              className="text-base font-bold text-black"
            >
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

      <View className="border-t border-[#e8e6e1] bg-background px-5 pb-7 pt-4">
        {deleteError && (
          <Text className="mb-2 text-center text-xs text-[#B3261E]">
            {deleteError}
          </Text>
        )}
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            testID="detail-edit-button"
            onPress={goToEdit}
            className="flex-1 items-center rounded-2xl border border-[#e8e6e1] bg-white py-3.5"
          >
            <Text className="text-sm font-bold text-black">수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="detail-delete-button"
            disabled={deleteMutation.isPending}
            onPress={confirmDelete}
            className={`flex-1 items-center rounded-2xl border border-[#e7c8c5] bg-white py-3.5 ${
              deleteMutation.isPending ? 'opacity-40' : ''
            }`}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator
                testID="detail-delete-loading"
                color="#B3261E"
              />
            ) : (
              <Text className="text-sm font-bold text-[#B3261E]">삭제</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ReceiptDetailScreen;
