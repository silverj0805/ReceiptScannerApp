/**
 * @format
 */

import { render, screen, waitFor } from '@testing-library/react-native';

import App from './App';

test('renders the home tab on launch', async () => {
  await render(<App />);

  expect(screen.getByText('홈')).toBeTruthy();

  // HomeScreen의 summary/list 쿼리가 테스트 종료 후(act 밖에서) resolve되면서
  // "not wrapped in act(...)" 경고가 나는 걸 막기 위해 완전히 settle될 때까지 기다림.
  await waitFor(() => {
    expect(screen.queryByTestId('home-loading')).toBeNull();
  });
});
