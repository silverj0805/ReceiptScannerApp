import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import type {
  RootStackParamList,
  StackParamList,
} from '@/app/navigation/types';
import { receiptQueryFactory, receiptRepository } from '@/features/receipt/api';
import type { CreateReceiptPayload } from '@/features/receipt/api/types/receipt';

import AmountField from '../components/AmountField';
import CategoryField from '../components/CategoryField';
import ConfirmHeader from '../components/ConfirmHeader';
import ConfirmLoading from '../components/ConfirmLoading';
import DateField from '../components/DateField';
import ItemNameField from '../components/ItemNameField';
import MerchantField from '../components/MerchantField';
import RawTextSection from '../components/RawTextSection';
import RecognitionFailed from '../components/RecognitionFailed';
import SaveFooter from '../components/SaveFooter';
import ScannedReceiptCard from '../components/ScannedReceiptCard';
import useScanReceipt from '../hooks/useScanReceipt';
import { DEFAULT_VALUES, type ConfirmFormValues } from '../types';

function ConfirmScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const backgroundColor = useCSSVariable('--color-background');
  const queryClient = useQueryClient();

  const route = useRoute<RouteProp<StackParamList, 'Confirm'>>();
  const { imageUri, info } = route.params;
  const isEditMode = info != null;
  const editingReceiptId = info ? String(info.id) : undefined;
  const isDirectEntry = !isEditMode && !imageUri;

  const [rawText, setRawText] = useState<string | null>(
    isEditMode ? (info.rawText ?? '') : isDirectEntry ? '' : null,
  );
  const [manualEntry, setManualEntry] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: createReceipt } = useMutation({
    mutationFn: receiptRepository.postReceipt,
    onSuccess: () => {
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
    mode: 'onChange',
  });

  useScanReceipt({ imageUri, isEditMode, reset, setRawText });

  const goBack = () => navigation.goBack();
  const enterManually = () => setManualEntry(true);

  const onSubmit = async (values: ConfirmFormValues) => {
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

    if (isEditMode) {
      await updateReceipt(payload).catch(() => {});
    } else {
      await createReceipt(payload).catch(() => {});
    }
  };

  if (rawText === null) {
    return <ConfirmLoading />;
  }

  const isRecognitionFailed =
    !isEditMode && !isDirectEntry && rawText === '' && !manualEntry;

  if (isRecognitionFailed) {
    return <RecognitionFailed goBack={goBack} enterManually={enterManually} />;
  }

  const title = isEditMode
    ? '영수증 수정'
    : isDirectEntry
      ? '영수증 기록'
      : '인식 결과 확인';

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor }}
    >
      <ConfirmHeader title={title} onBack={goBack} />

      <KeyboardAwareScrollView
        bottomOffset={20}
        contentContainerClassName="gap-3.5 px-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {!isEditMode && !isDirectEntry && (
          <ScannedReceiptCard onRetake={goBack} />
        )}

        {rawText ? (
          <RawTextSection
            rawText={rawText}
            showRaw={showRaw}
            onToggle={() => setShowRaw(prev => !prev)}
          />
        ) : null}

        <MerchantField control={control} errors={errors} />
        <ItemNameField control={control} />
        <AmountField control={control} errors={errors} />
        <DateField control={control} errors={errors} />
        <CategoryField control={control} errors={errors} />
      </KeyboardAwareScrollView>

      <SaveFooter
        isEditMode={isEditMode}
        isValid={isValid}
        isLoading={isLoading}
        submitError={submitError}
        onSave={() => handleSubmit(onSubmit)()}
      />
    </SafeAreaView>
  );
}

export default ConfirmScreen;
