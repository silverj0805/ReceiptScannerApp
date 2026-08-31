import { ErrorMessage } from '@hookform/error-message';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import type {
  RootStackParamList,
  StackParamList,
} from '@/app/navigation/types';
import { receiptQueryFactory, receiptRepository } from '@/features/receipt/api';
import type { CategoryId } from '@/features/receipt/api/types/category';
import type { CreateReceiptPayload } from '@/features/receipt/api/types/receipt';
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
  // 옵셔널 필드 — 빈 문자열이어도 저장 가능(onSubmit에서 undefined로 변환해서 보냄).
  itemName: string;
  amount: string;
  date: string;
  // ''(빈 값) = 아직 선택 안 함. 저장하기를 누르기 전에도 반드시 사용자가 직접 골라야 함.
  category: CategoryId | '';
}

const DEFAULT_VALUES: ConfirmFormValues = {
  merchant: '',
  itemName: '',
  amount: '',
  date: '',
  category: '',
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 폼 값(YYYY-MM-DD 문자열) <-> 피커가 다루는 Date 객체 변환.
// 아직 값이 없거나(직접 입력 모드 초기 상태) 형식이 깨져 있으면 today를 기본값으로 보여준다.
// today는 호출부에서 매번 넘겨받는다 — 여기서 new Date()를 직접 만들면 렌더될 때마다
// (다른 필드 타이핑 등으로) 매번 다른 timestamp가 생겨서 <DateTimePicker value>가 계속
// 바뀐 값으로 보이고, 그 결과 첫 선택 시 스크롤 중인 피커가 계속 오늘 날짜로 리셋되며
// 사용자가 고른 값이 "바로 셋팅 안 되는" 것처럼 보이는 버그가 있었다.
const toPickerDate = (value: string, today: Date) =>
  DATE_PATTERN.test(value) ? dayjs(value).toDate() : today;
const formatPickerDate = (date: Date) => dayjs(date).format('YYYY-MM-DD');

// 촬영/갤러리 선택 사진은 둘 다 앱 전용 캐시에 있는 "임시" 사본이다(ScanScreen의
// 카메라 캡처, react-native-image-picker 공식 문서 둘 다 확인됨 — 갤러리 원본이
// 아니라 복사본이라 지워도 사용자의 실제 사진엔 영향 없음). OCR이 다 읽고 나면
// 더 필요 없는데 기기에 방치되는 게 보안 점검에서 지적됐던 부분이라, 인식이
// 끝나면(성공/실패 무관) 삭제한다. RNFS.unlink는 file:// 스킴을 안 붙인 순수
// 경로를 기대해서 있으면 떼어낸다.
function deleteTempImage(uri: string) {
  const path = uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
  // 실패해도(이미 없거나 접근 불가) 조용히 무시 — 이건 OS가 언젠가 정리해줄
  // 캐시라 삭제 실패가 사용자 흐름을 막을 이유는 없다.
  RNFS.unlink(path).catch(() => {});
}

function ConfirmScreen() {
  const backgroundColor = useCSSVariable('--color-background');
  const queryClient = useQueryClient();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<StackParamList, 'Confirm'>>();
  const { imageUri, info } = route.params;
  // info가 있으면 ReceiptDetailScreen의 "수정"에서 넘어온 것 — 새로 스캔하지 않고
  // 이미 저장돼 있는 값을 폼에 바로 채워서 보여준다.
  const isEditMode = info != null;
  const editingReceiptId = info ? String(info.id) : undefined;
  // 둘 다 없으면 하단 탭 "기록"에서 바로 넘어온 것 — 스캔할 이미지가 아예 없으므로
  // 인식/촬영 관련 UI를 전부 건너뛰고 빈 폼으로 바로 직접 입력하게 한다.
  const isDirectEntry = !isEditMode && !imageUri;

  // null = 인식 중, ''(빈 문자열) = 인식 실패/직접 입력, 그 외 = 인식된 원문.
  // 수정·직접입력 모드는 스캔을 안 하므로 로딩/실패 화면을 절대 거치지 않고 바로
  // 폼을 보여준다.
  const [rawText, setRawText] = useState<string | null>(
    isEditMode ? info.rawText ?? '' : isDirectEntry ? '' : null,
  );
  const [manualEntry, setManualEntry] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // 저장/수정 요청이 진행되는 동안 버튼을 막아 중복 제출을 방지한다.
  const [isLoading, setIsLoading] = useState(false);

  // iOS 전용 — 날짜 피커를 담는 바텀시트 Modal의 표시 여부.
  // (Android는 DateTimePickerAndroid.open()이 OS 다이얼로그를 직접 띄우므로 불필요.)
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  // iOS 스피너가 현재 가리키고 있는 값(확정 전). UIDatePicker는 사용자가 휠을 실제로
  // 굴려야만 onChange가 오기 때문에, 기본값을 그대로 두고 "확인"만 누르면 onChange가
  // 한 번도 안 와서 폼에 반영이 안 되는 문제가 있었음 — "확인"을 누를 때 이 값을
  // 무조건 커밋해서 해결(휠을 안 건드렸어도 화면에 보이는 값 = 이 값이므로 안전).
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  // 피커의 기본/최대 날짜로 쓸 "오늘" — 렌더마다 new Date()를 새로 만들면 피커에
  // 매번 다른 값이 내려가서 스크롤 중인 선택이 리셋되므로 최초 1회만 계산해 고정한다.
  const [today] = useState(() => new Date());

  const { mutateAsync: createReceipt } = useMutation({
    mutationFn: receiptRepository.postReceipt,
    onSuccess: () => {
      // 목록/요약 갱신은 더 이상 invalidateQueries에 기대지 않음 — Home이
      // useFocusEffect로 포커스될 때마다 직접 refetch한다(더 안정적으로 확인됨).
      setIsLoading(false);
      navigation.goBack();
      navigation.navigate('BottomTabs', { screen: 'Home' });
    },
    onError: () => {
      setIsLoading(false);
      setSubmitError('저장에 실패했어요. 다시 시도해주세요.');
    },
  });

  const { mutateAsync: updateReceipt } = useMutation({
    mutationFn: (payload: CreateReceiptPayload) =>
      receiptRepository.patchReceipt(editingReceiptId ?? '', payload),
    onSuccess: () => {
      // 수정 직후 돌아가는 화면(ReceiptDetailScreen) 자체는 useFocusEffect가 아니라
      // 이 명시적 invalidateQueries로 갱신한다 — 이쪽은 안정적으로 동작 확인됨.
      // 목록/요약(Home, ReceiptListScreen)은 각 화면의 useFocusEffect가 담당.
      if (editingReceiptId) {
        queryClient.invalidateQueries({
          queryKey: receiptQueryFactory.detail(editingReceiptId).queryKey,
          refetchType: 'all',
        });
      }
      setIsLoading(false);
      navigation.goBack();
    },
    onError: () => {
      setIsLoading(false);
      setSubmitError('수정에 실패했어요. 다시 시도해주세요.');
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ConfirmFormValues>({
    defaultValues: isEditMode
      ? {
          merchant: info.merchant,
          itemName: info.itemName ?? '',
          amount: String(info.amount),
          date: info.date,
          category: info.category,
        }
      : DEFAULT_VALUES,
    // 필드가 바뀔 때마다 다시 검증해서 저장하기 버튼 활성화 여부가 실시간으로 반영되게 함.
    mode: 'onChange',
  });

  useEffect(() => {
    if (isEditMode) return; // 수정 모드는 이미 값이 다 있으니 스캔 불필요.
    if (!imageUri) return; // 방어적 처리 — 스캔 플로우면 항상 있어야 함.

    NativeReceiptScanner.scanText(imageUri)
      .then(text => {
        setRawText(text);
        if (text === '') return;

        const parsed = parseReceiptText(text);
        reset({
          merchant: parsed.merchant ?? '',
          // 품명은 아직 자동 인식 대상이 아님 — 항상 빈 값에서 시작, 필요하면 직접 입력.
          itemName: '',
          amount: parsed.amount != null ? String(parsed.amount) : '',
          date: parsed.date ?? '',
          // 자동 인식 결과라도 카테고리는 사용자가 직접 확인하고 고르게 함.
          category: '',
        });
      })
      .catch(() => {
        // 네이티브 쪽(ReceiptScannerModule.kt)이 파일 접근 실패 등으로 reject할 수 있음
        // (예: 존재하지 않는 imageUri) — 처리 안 하면 unhandled rejection으로 앱이
        // 죽은 것처럼 보이므로, 빈 문자열로 취급해서 기존 "인식 실패" 화면으로 보냄.
        setRawText('');
      })
      .finally(() => {
        deleteTempImage(imageUri);
      });
  }, [imageUri, isEditMode, reset]);

  const goBack = () => navigation.goBack();
  const enterManually = () => setManualEntry(true);

  const onSubmit = async (values: ConfirmFormValues) => {
    // category는 rules={{required}}로 검증되므로 여기 도달했다면 항상 채워져 있음 — 타입 좁히기용.
    if (values.category === '') return;

    setSubmitError(null);
    setIsLoading(true);
    const payload: CreateReceiptPayload = {
      merchant: values.merchant,
      itemName: values.itemName || undefined,
      amount: Number(values.amount),
      category: values.category,
      date: values.date,
      rawText: rawText || undefined,
    };
    // catch는 onError가 이미 처리한 rejection이 unhandled promise rejection으로
    // 새어나가는 것만 막는 용도(에러 문구/isLoading 해제는 onError에서 이미 처리됨).
    if (isEditMode) {
      await updateReceipt(payload).catch(() => {});
    } else {
      await createReceipt(payload).catch(() => {});
    }
  };

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

  // 수정·직접입력 모드는 스캔을 안 하므로(rawText가 애초에 null이 아님) 여기 도달할
  // 일이 없지만, rawText가 우연히 빈 값이어도 "인식 실패" 화면(스캔 전용 문구)이
  // 뜨면 안 되므로 명시적으로 막는다.
  const isRecognitionFailed =
    !isEditMode && !isDirectEntry && rawText === '' && !manualEntry;

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
      style={{ flex: 1, backgroundColor }}
    >
      <View className="flex-row items-center justify-between p-5">
        <Pressable onPress={goBack} hitSlop={8}>
          <Icon name="chevron-back" size={22} colorClassName="accent-black" />
        </Pressable>
        <Text className="text-[15px] font-bold text-black">
          {isEditMode
            ? '영수증 수정'
            : isDirectEntry
            ? '영수증 기록'
            : '인식 결과 확인'}
        </Text>
        <View className="w-5.5" />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={20}
        contentContainerClassName="gap-3.5 px-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* 촬영한 영수증 카드/안내 문구 — 수정·직접입력 모드는 사진이 없으니 안 보여줌 */}
        {!isEditMode && !isDirectEntry && (
          <>
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
                <Text className="text-xs font-bold text-primary">
                  다시 촬영
                </Text>
              </Pressable>
            </View>

            <View className="flex-row items-center gap-2">
              <Icon
                name="information-circle-outline"
                size={15}
                colorClassName="accent-gray"
              />
              <Text className="text-xs text-gray">
                자동 인식 결과는 부정확할 수 있습니다. 확인 후 저장해주세요.
              </Text>
            </View>
          </>
        )}

        {/* 인식된 원문 — 원문 자체가 없으면(수정 모드에서 흔함) 섹션 자체를 안 보여줌 */}
        {rawText && (
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
        )}

        {/* 가맹점명 */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-gray">*가맹점명</Text>
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

        {/* 품명 — 옵셔널, 필수 필드가 아니라 rules 없음 */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-gray">품명</Text>
          <Controller
            control={control}
            name="itemName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                testID="item-name-input"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="품명을 입력해주세요 (선택)"
                className="rounded-xl border border-[#e8e6e1] bg-white px-3.5 py-3.5 text-sm font-semibold text-black"
              />
            )}
          />
        </View>

        {/* 금액 */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-gray">*금액</Text>
          <Controller
            control={control}
            name="amount"
            rules={{ required: '금액을 입력해주세요' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="flex-row items-center rounded-xl border border-[#e8e6e1] bg-white px-3.5 py-3.5">
                <Text className="text-lg font-extrabold text-gray">₩</Text>
                <TextInput
                  testID="amount-input"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  placeholder="0"
                  className="flex-1 text-right text-lg font-extrabold text-black"
                />
              </View>
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

        {/* 날짜 — 네이티브 피커로 선택(오타/형식 오류 원천 차단). */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-gray">*날짜</Text>
          <Controller
            control={control}
            name="date"
            rules={{ required: '날짜를 선택해주세요' }}
            render={({ field: { onChange, value } }) => {
              const openPicker = () => {
                if (Platform.OS === 'android') {
                  // Android는 OS 다이얼로그를 직접 띄움 — 별도 Modal 불필요.
                  // (DatePickerDialog는 "확인"을 누르면 건드리지 않았어도 항상 현재
                  // 표시된 날짜로 onDateSet을 호출하므로 이쪽은 이 문제가 없음.)
                  DateTimePickerAndroid.open({
                    value: toPickerDate(value, today),
                    mode: 'date',
                    maximumDate: today,
                    onChange: (event, selectedDate) => {
                      if (event.type === 'set' && selectedDate) {
                        onChange(formatPickerDate(selectedDate));
                      }
                    },
                  });
                } else {
                  setPendingDate(toPickerDate(value, today));
                  setDatePickerOpen(true);
                }
              };

              return (
                <>
                  <Pressable
                    testID="date-input"
                    onPress={openPicker}
                    className="flex-row items-center gap-2 rounded-xl border border-[#e8e6e1] bg-white px-3.5 py-3.5"
                  >
                    <Icon
                      name="calendar-outline"
                      size={16}
                      colorClassName="accent-gray"
                    />
                    <Text
                      className={`flex-1 text-sm font-semibold ${
                        value ? 'text-black' : 'text-gray'
                      }`}
                    >
                      {value
                        ? dayjs(value).format('YYYY년 M월 D일')
                        : '날짜를 선택해주세요'}
                    </Text>
                  </Pressable>

                  {Platform.OS === 'ios' && (
                    <Modal
                      testID="date-picker-modal"
                      visible={datePickerOpen}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setDatePickerOpen(false)}
                    >
                      <View className="flex-1 justify-end">
                        <Pressable
                          style={StyleSheet.absoluteFill}
                          className="bg-black/40"
                          onPress={() => setDatePickerOpen(false)}
                        />
                        <View className="rounded-t-3xl bg-white px-5 pb-8 pt-3">
                          <View className="mb-2 items-center">
                            <View className="h-1 w-9 rounded-full bg-[#e8e6e1]" />
                          </View>
                          <DateTimePicker
                            testID="date-picker-native"
                            value={pendingDate ?? toPickerDate(value, today)}
                            mode="date"
                            display="spinner"
                            maximumDate={today}
                            onValueChange={(event, selectedDate) => {
                              if (selectedDate) {
                                setPendingDate(selectedDate);
                              }
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              // 휠을 한 번도 안 건드렸어도 화면에 보이는 값(pendingDate)을
                              // 그대로 커밋 — onChange가 안 왔다고 값이 안 들어가면 안 됨.
                              onChange(
                                formatPickerDate(
                                  pendingDate ?? toPickerDate(value, today),
                                ),
                              );
                              setDatePickerOpen(false);
                            }}
                            className="mt-3 items-center rounded-2xl bg-primary py-3.5"
                          >
                            <Text className="text-base font-bold text-white">
                              확인
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Modal>
                  )}
                </>
              );
            }}
          />
          <ErrorMessage
            errors={errors}
            name="date"
            render={({ message }) => (
              <Text className="text-xs text-[#B3261E]">{message}</Text>
            )}
          />
        </View>

        {/* 카테고리 */}
        <View className="gap-2">
          <Text className="text-xs font-semibold text-gray">*카테고리</Text>
          <Controller
            control={control}
            name="category"
            rules={{ required: '카테고리를 선택해주세요' }}
            render={({ field: { onChange, value } }) => (
              <View className="flex-row flex-wrap gap-1">
                {CATEGORY_IDS.map(id => {
                  const categoryInfo = getCategoryInfo(id);
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
                        backgroundColor: selected ? categoryInfo.bg : '#ffffff',
                        borderWidth: 1,
                        borderColor: selected ? categoryInfo.color : '#e8e6e1',
                      }}
                    >
                      <Text
                        className="text-[13px] font-bold"
                        style={{
                          color: selected ? categoryInfo.color : '#6f6d68',
                        }}
                      >
                        {categoryInfo.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
          <ErrorMessage
            errors={errors}
            name="category"
            render={({ message }) => (
              <Text className="text-xs text-[#B3261E]">{message}</Text>
            )}
          />
        </View>
      </KeyboardAwareScrollView>

      <View className="border-t border-[#e8e6e1] bg-background px-5 pb-7 pt-4">
        {submitError && (
          <Text className="mb-2 text-center text-xs text-[#B3261E]">
            {submitError}
          </Text>
        )}
        <TouchableOpacity
          testID="save-button"
          disabled={!isValid || isLoading}
          onPress={() => handleSubmit(onSubmit)()}
          className={`items-center rounded-2xl bg-primary py-4 ${
            isValid ? '' : 'opacity-40'
          }`}
        >
          {isLoading ? (
            <View className="py-0.5">
              <ActivityIndicator testID="save-loading" color="#ffffff" />
            </View>
          ) : (
            <Text className="text-base font-bold text-white">
              {isEditMode ? '수정하기' : '저장하기'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default ConfirmScreen;
