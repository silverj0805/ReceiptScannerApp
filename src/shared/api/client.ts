import axios from 'axios';
import Config from 'react-native-config';
import { getUniqueId } from 'react-native-device-info';

import { recordApiError } from '@/shared/firebase/crashlyticsRecorder';

const REQUEST_TIMEOUT_MS = 10_000;

const client = axios.create({
  baseURL: Config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT_MS,
});

// 기기별 고유 ID(react-native-device-info의 getUniqueId)를 매 요청에 X-Device-Id 헤더로 실어 보냄.
// 진짜 인증은 아니고(헤더 조작 가능), receiptsRouter의 미들웨어가 이 헤더 없으면 400을 줌.
client.interceptors.request.use(async config => {
  const deviceId = await getUniqueId();
  config.headers['X-Device-Id'] = deviceId;
  return config;
});

// API 에러는 화면/엔드포인트/상태코드/응답 본문 컨텍스트와 함께 Crashlytics에 기록.
client.interceptors.response.use(
  response => response,
  error => {
    recordApiError(error, error?.config, error?.response);
    return Promise.reject(error);
  },
);

export default client;
