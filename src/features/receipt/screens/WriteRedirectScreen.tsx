import { View } from 'react-native';

// 실제로 렌더될 일이 없는 더미 화면. WriteTabButton이 탭 프레스를 가로채서
// Stacks/Confirm으로 바로 보내버리기 때문에 이 탭으로 포커스가 오는 경우가 없음 —
// Tab.Screen 등록에 component가 필수라 자리만 채워둔다.
function WriteRedirectScreen() {
  return <View />;
}

export default WriteRedirectScreen;
