/**
 * @format
 */

import { render, screen } from '@testing-library/react-native';

import App from './App';

test('renders the home tab on launch', async () => {
  await render(<App />);

  expect(screen.getByText('홈')).toBeTruthy();
});
