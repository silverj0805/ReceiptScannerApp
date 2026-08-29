// Jest 환경(실제 네이티브 바이너리 없음)에서 @react-native-firebase/crashlytics를
// import만 해도 내부적으로 @react-native-firebase/app의 네이티브 모듈 등록 코드가
// 실행돼서 "Native module NativeRNFBTurboApp is not registered" 에러가 남 —
// 공식 jest mock이 없어서(react-native-firebase 자체 이슈 트래커에서도 확인됨),
// 실제 쓰는 함수만 목으로 대체.
export const getCrashlytics = jest.fn(() => ({}));
export const log = jest.fn();
export const recordError = jest.fn();
export const setAttribute = jest.fn(() => Promise.resolve(null));
export const setAttributes = jest.fn(() => Promise.resolve(null));
export const setUserId = jest.fn(() => Promise.resolve(null));
export const crash = jest.fn();
export const checkForUnsentReports = jest.fn(() => Promise.resolve(false));
export const deleteUnsentReports = jest.fn(() => Promise.resolve());
export const didCrashOnPreviousExecution = jest.fn(() => Promise.resolve(false));
export const sendUnsentReports = jest.fn();
export const setCrashlyticsCollectionEnabled = jest.fn(() =>
  Promise.resolve(null),
);
