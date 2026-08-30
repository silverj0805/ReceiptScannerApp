import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';

import { WISE_SAYINGS } from './constants';

import WiseSaying from './index';

type ParamList = { Home: undefined; Other: undefined };

const Stack = createNativeStackNavigator<ParamList>();

const OtherScreen = () => <View />;

const renderOnHome = (
  navigationRef: ReturnType<typeof createNavigationContainerRef<ParamList>>,
) =>
  render(
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={WiseSaying} />
        <Stack.Screen name="Other" component={OtherScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );

afterEach(() => {
  jest.restoreAllMocks();
});

// 컴포넌트가 💡"{saying}" 형태로 이모지/따옴표까지 같은 Text에 붙여서 렌더링하므로
// getByText의 기본 정확 일치로는 못 찾는다 — exact: false(부분 일치)로 찾는다.
// index도 하드코딩하면 WISE_SAYINGS 배열 길이가 바뀔 때마다 다시 깨지므로, 컴포넌트와
// 동일한 공식(Math.floor(random * length))으로 매번 계산한다.
const randomIndexFor = (random: number) =>
  Math.floor(random * WISE_SAYINGS.length);

test('홈이 포커스되면 목록 중 하나의 명언을 보여준다', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  await renderOnHome(createNavigationContainerRef<ParamList>());

  expect(
    screen.getByText(WISE_SAYINGS[randomIndexFor(0.5)], { exact: false }),
  ).toBeTruthy();
});

test('홈이 다시 포커스되면 새 인덱스의 명언을 보여준다', async () => {
  const navigationRef = createNavigationContainerRef<ParamList>();
  const random = jest.spyOn(Math, 'random');
  random.mockReturnValue(0);
  await renderOnHome(navigationRef);
  expect(
    screen.getByText(WISE_SAYINGS[randomIndexFor(0)], { exact: false }),
  ).toBeTruthy();

  random.mockReturnValue(0.5);
  await act(async () => {
    navigationRef.navigate('Other');
  });
  await act(async () => {
    navigationRef.navigate('Home');
  });

  await waitFor(() => {
    expect(
      screen.getByText(WISE_SAYINGS[randomIndexFor(0.5)], { exact: false }),
    ).toBeTruthy();
  });
});
