import { ErrorMessage } from '@hookform/error-message';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { StackParamList } from '@/app/navigation/types';
import type { CategoryId } from '@/features/receipt/api/types/category';
import Icon from '@/shared/components/ui/Icon';
import { getCategoryInfo } from '@/shared/utils/category';
import NativeReceiptScanner from '@specs/NativeReceiptScanner';

import { parseReceiptText } from '../utils/parseReceiptText';

const CATEGORY_IDS: CategoryId[] = [
  'food',
  'transit',
  'shop',
  'culture',
  'health',
  'etc',
];

interface ConfirmFormValues {
  merchant: string;
  amount: string;
  date: string;
  category: CategoryId;
}

const DEFAULT_VALUES: ConfirmFormValues = {
  merchant: '',
  amount: '',
  date: '',
  category: 'food',
};

function ConfirmScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<StackParamList, 'Confirm'>>();
  const { imageUri } = route.params;

  // null = 인식 중, ''(빈 문자열) = 인식 실패, 그 외 = 인식된 원문.
  const [rawText, setRawText] = useState<string | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfirmFormValues>({ defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    NativeReceiptScanner.scanText(imageUri)
      .then(text => {
        setRawText(text);
        if (text === '') return;

        const parsed = parseReceiptText(text);
        reset({
          merchant: parsed.merchant ?? '',
          amount: parsed.amount != null ? String(parsed.amount) : '',
          date: parsed.date ?? '',
          category: 'food',
        });
      })
      .catch(() => {
        // 네이티브 쪽(ReceiptScannerModule.kt)이 파일 접근 실패 등으로 reject할 수 있음
        // (예: 존재하지 않는 imageUri) — 처리 안 하면 unhandled rejection으로 앱이
        // 죽은 것처럼 보이므로, 빈 문자열로 취급해서 기존 "인식 실패" 화면으로 보냄.
        setRawText('');
      });
  }, [imageUri, reset]);

  const goBack = () => navigation.goBack();
  const enterManually = () => setManualEntry(true);
  // TODO(다음 단계): POST /receipts 연동.
  const onSubmit = () => {};

  if (rawText === null) {
    return (
      <View
        testID="confirm-loading"
        className="flex-1 items-center justify-center bg-background"
      >
        <ActivityIndicator color="#1B5E43" />
      </View>
    );
  }

  const isRecognitionFailed = rawText === '' && !manualEntry;

  if (isRecognitionFailed) {
    return (
      <View className="flex-1 items-center justify-center gap-4.5 bg-background px-8">
        <Icon
          name="document-text-outline"
          size={72}
          colorClassName="accent-primary"
        />
        <View className="items-center gap-2">
          <Text className="text-[17px] font-extrabold text-black">
            텍스트를 인식하지 못했어요
          </Text>
          <Text className="text-center text-[13px] leading-5 text-gray">
            다시 촬영하거나{'\n'}직접 입력할 수 있어요
          </Text>
        </View>
        <View className="flex-row gap-2.5">
          <Pressable
            onPress={goBack}
            className="rounded-2xl border border-[#e8e6e1] bg-white px-5.5 py-3.5"
          >
            <Text className="text-sm font-bold text-black">다시 촬영</Text>
          </Pressable>
          <Pressable
            onPress={enterManually}
            className="rounded-2xl bg-primary px-5.5 py-3.5"
          >
            <Text className="text-sm font-bold text-white">직접 입력</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1 }}
      className="bg-background"
    >
      <View className="flex-row items-center justify-between p-5">
        <Pressable onPress={goBack} hitSlop={8}>
          <Icon name="chevron-back" size={22} colorClassName="accent-black" />
        </Pressable>
        <Text className="text-[15px] font-bold text-black">
          인식 결과 확인
        </Text>
        <View className="w-[22px]" />
      </View>

      <ScrollView
        contentContainerClassName="gap-3.5 px-5 pb-5"
        keyboardShouldPersistTaps="handled"
      >
        {/* 촬영한 영수증 카드 */}
        <View className="flex-row items-center justify-between rounded-2xl border border-[#e8e6e1] bg-white px-3.5 py-3">
          <View className="flex-row items-center gap-3">
            <View className="h-14 w-11 items-center justify-center rounded-lg border border-[#e8e6e1] bg-white">
              <Icon
                name="document-outline"
                size={20}
                colorClassName="accent-gray"
              />
            </View>
            <Text className="text-xs text-gray">촬영한 영수증</Text>
          </View>
          <Pressable onPress={goBack}>
            <Text className="text-xs font-bold text-primary">다시 촬영</Text>
          </Pressable>
        </View>

        {/* 안내 문구 */}
        <View className="flex-row items-center gap-2">
          <Icon
            name="information-circle-outline"
            size={15}
            colorClassName="accent-gray"
          />
          <Text className="text-xs text-gray">
            자동 인식 결과예요. 확인 후 저장해주세요
          </Text>
        </View>

        {/* 인식된 원문 */}
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
                {rawText}
              </Text>
            </View>
          )}
        </View>

        {/* 가맹점명 */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-gray">가맹점명</Text>
          <Controller
            control={control}
            name="merchant"
            rules={{ required: '가맹점명을 입력해주세요' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="merchant-input"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="가맹점명을 입력해주세요"
                className="rounded-xl border border-[#e8e6e1] bg-white px-3.5 py-3.5 text-sm font-semibold text-black"
              />
            )}
          />
          <ErrorMessage
            errors={errors}
            name="merchant"
            render={({ message }) => (
              <Text className="text-xs text-[#B3261E]">{message}</Text>
            )}
          />
        </View>

        {/* 금액 */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-gray">금액</Text>
          <Controller
            control={control}
            name="amount"
            rules={{ required: '금액을 입력해주세요' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="amount-input"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="number-pad"
                placeholder="0"
                className="rounded-xl border border-[#e8e6e1] bg-white px-3.5 py-3.5 text-right text-lg font-extrabold text-black"
              />
            )}
          />
          <ErrorMessage
            errors={errors}
            name="amount"
            render={({ message }) => (
              <Text className="text-xs text-[#B3261E]">{message}</Text>
            )}
          />
        </View>

        {/* 날짜 — 이번 스코프는 인식된 값을 보여주기만 함(피커는 다음 단계). */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-gray">날짜</Text>
          <Controller
            control={control}
            name="date"
            render={({ field: { value } }) => (
              <View className="flex-row items-center gap-2 rounded-xl border border-[#e8e6e1] bg-white px-3.5 py-3.5">
                <Icon
                  name="calendar-outline"
                  size={16}
                  colorClassName="accent-gray"
                />
                <Text className="text-sm font-semibold text-black">
                  {value || '날짜를 인식하지 못했어요'}
                </Text>
              </View>
            )}
          />
        </View>

        {/* 카테고리 */}
        <View className="gap-2">
          <Text className="text-xs font-semibold text-gray">카테고리</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row flex-wrap gap-2">
                {CATEGORY_IDS.map(id => {
                  const info = getCategoryInfo(id);
                  const selected = value === id;
                  return (
                    <Pressable
                      key={id}
                      testID={`category-${id}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => onChange(id)}
                      className="rounded-full px-3.5 py-2"
                      style={{
                        backgroundColor: selected ? info.bg : '#ffffff',
                        borderWidth: 1,
                        borderColor: selected ? info.color : '#e8e6e1',
                      }}
                    >
                      <Text
                        className="text-[13px] font-bold"
                        style={{ color: selected ? info.color : '#6f6d68' }}
                      >
                        {info.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>
      </ScrollView>

      <View className="border-t border-[#e8e6e1] bg-background px-5 pb-7 pt-4">
        <Pressable
          onPress={() => handleSubmit(onSubmit)()}
          className="items-center rounded-2xl bg-primary py-4"
        >
          <Text className="text-[15px] font-bold text-white">저장하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default ConfirmScreen;
