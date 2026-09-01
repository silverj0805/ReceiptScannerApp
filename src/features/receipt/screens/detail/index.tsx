import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import type { StackParamList } from '@/app/navigation/types';
import { receiptQueryFactory, receiptRepository } from '@/features/receipt/api';

import DetailError from '../../components/detail/DetailError';
import DetailFooter from '../../components/detail/DetailFooter';
import DetailHeader from '../../components/detail/DetailHeader';
import DetailRawText from '../../components/detail/DetailRawText';
import DetailSkeleton from '../../components/detail/DetailSkeleton';
import ReceiptInfoCard from '../../components/detail/ReceiptInfoCard';

function ReceiptDetailScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<StackParamList>;
}) {
  const route = useRoute<RouteProp<StackParamList, 'Detail'>>();
  const { receiptId } = route.params;

  const backgroundColor = useCSSVariable('--color-background');

  const [showRaw, setShowRaw] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const detailQuery = useQuery(receiptQueryFactory.detail(receiptId));

  const goBack = () => navigation.goBack();

  const deleteMutation = useMutation({
    mutationFn: () => receiptRepository.deleteReceipt(receiptId),
    onSuccess: () => {
      // 목록 갱신은 invalidateQueries에 기대지 않음
      // HomeScreen에서 useFocusEffect로 포커스될 때마다 직접 refetch
      setIsDeleting(false);
      goBack();
    },
    onError: () => {
      setIsDeleting(false);
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
        onPress: () => {
          setIsDeleting(true);
          deleteMutation.mutate();
        },
      },
    ]);
  };

  if (detailQuery.isError) {
    const isNotFound =
      axios.isAxiosError(detailQuery.error) &&
      detailQuery.error.response?.status === 404;
    return <DetailError isNotFound={isNotFound} goBack={goBack} />;
  }

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, backgroundColor }}
      >
        <DetailHeader onBack={goBack} />
        <DetailSkeleton />
      </SafeAreaView>
    );
  }

  const receipt = detailQuery.data.data;
  const goToEdit = () => navigation.navigate('Confirm', { info: receipt });

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor }}
    >
      <DetailHeader onBack={goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-3.5 px-5 pb-5"
      >
        <ReceiptInfoCard receipt={receipt} />
        {receipt.rawText ? (
          <DetailRawText
            rawText={receipt.rawText}
            showRaw={showRaw}
            onToggle={() => setShowRaw(prev => !prev)}
          />
        ) : null}
      </ScrollView>

      <DetailFooter
        deleteError={deleteError}
        isDeleting={isDeleting}
        onEdit={goToEdit}
        onDelete={confirmDelete}
      />
    </SafeAreaView>
  );
}

export default ReceiptDetailScreen;
