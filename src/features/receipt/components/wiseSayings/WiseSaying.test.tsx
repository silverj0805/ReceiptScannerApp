import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';

import WiseSaying from './index';
import { WISE_SAYINGS } from './constants';

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

test('명언은 30개다', () => {
  expect(WISE_SAYINGS).toHaveLength(30);
});

test('홈이 포커스되면 목록 중 하나의 명언을 보여준다', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  await renderOnHome(createNavigationContainerRef<ParamList>());

  expect(screen.getByText(WISE_SAYINGS[15])).toBeTruthy();
});

test('홈이 다시 포커스되면 새 인덱스의 명언을 보여준다', async () => {
  const navigationRef = createNavigationContainerRef<ParamList>();
  const random = jest.spyOn(Math, 'random');
  random.mockReturnValue(0);
  await renderOnHome(navigationRef);
  expect(screen.getByText(WISE_SAYINGS[0])).toBeTruthy();

  random.mockReturnValue(0.5);
  await act(async () => {
    navigationRef.navigate('Other');
  });
  await act(async () => {
    navigationRef.navigate('Home');
  });

  await waitFor(() => {
    expect(screen.getByText(WISE_SAYINGS[15])).toBeTruthy();
  });
});
