import { type NavigationState } from '@react-navigation/native';

/**
 * 중첩 네비게이터(RootStack 안의 BottomTab 등)를 타고 내려가 실제 활성 화면 이름을 뽑아냄
 * 탭 안에 있을 땐 state.routes[index]가 다시 하위 네비게이터의 state를 갖고 있어서 재귀적으로 내려가야 함
 */
export function getActiveRouteName(
  state: NavigationState | undefined,
): string | null {
  if (!state) return null;

  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}
