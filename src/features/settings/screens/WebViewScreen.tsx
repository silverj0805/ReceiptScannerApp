import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import type { StackParamList } from '@/app/navigation/types';
import Icon from '@/shared/components/ui/Icon';

// 개인정보처리방침/이용약관처럼 외부(노션 등)에 발행한 페이지를 보여줄 때 재사용하는
// 범용 WebView 화면. route.params.url이 아직 없으면(빈 문자열) 페이지를 열지 않고
// "준비 중" 안내만 보여준다 — 실제 URL은 노션 발행 후 constants/urls.ts에 채워 넣으면 됨.
function WebViewScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<StackParamList>>();
  const route = useRoute<RouteProp<StackParamList, 'WebView'>>();
  const { url, title } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const goBack = () => navigation.goBack();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1 }}
      className="bg-background"
    >
      <View className="flex-row items-center justify-between p-5">
        <Pressable testID="webview-back-button" onPress={goBack} hitSlop={8}>
          <Icon name="chevron-back" size={22} colorClassName="accent-black" />
        </Pressable>
        <Text
          className="mx-3 flex-1 text-center text-[15px] font-bold text-black"
          numberOfLines={1}
        >
          {title}
        </Text>
        <View className="w-5.5" />
      </View>

      {!url ? (
        <View
          testID="webview-not-ready"
          className="flex-1 items-center justify-center gap-3 px-8"
        >
          <Icon name="time-outline" size={48} colorClassName="accent-gray" />
          <Text className="text-sm font-bold text-black">
            아직 준비 중이에요
          </Text>
          <Text className="text-center text-xs text-gray">
            곧 확인하실 수 있도록 준비하고 있어요
          </Text>
        </View>
      ) : hasError ? (
        <View
          testID="webview-error"
          className="flex-1 items-center justify-center gap-3 px-8"
        >
          <Icon
            name="alert-circle-outline"
            size={48}
            colorClassName="accent-gray"
          />
          <Text className="text-sm font-bold text-black">
            불러오지 못했어요
          </Text>
          <Text className="text-center text-xs text-gray">
            네트워크 상태를 확인한 뒤 다시 시도해주세요
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <WebView
            testID="webview"
            source={{ uri: url }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
          {isLoading && (
            <View
              testID="webview-loading"
              style={StyleSheet.absoluteFill}
              className="items-center justify-center bg-background"
            >
              <ActivityIndicator color="#1B5E43" />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

export default WebViewScreen;
