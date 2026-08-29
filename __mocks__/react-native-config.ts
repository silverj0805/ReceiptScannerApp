// react-native-config는 네이티브 모듈이라 Jest(실제 네이티브 바이너리 없음) 환경에서
// import만 해도 "native module RNCConfigModule was not found" 에러를 던짐.
// node_modules 패키지용 수동 목(manual mock)이라 __mocks__/react-native-config.*
// 파일만 있으면 Jest가 moduleNameMapper 없이도 자동으로 이 파일을 대신 사용함.
export default {
  API_BASE_URL: 'http://localhost',
};
