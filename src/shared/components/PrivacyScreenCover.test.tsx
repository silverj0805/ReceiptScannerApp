import { render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';

import PrivacyScreenCover from './PrivacyScreenCover';

// AppState.addEventListener를 spy로 가로채서, 실제 OS 이벤트 없이도 리스너를
// 직접 호출해 상태 전환('active' -> 'background' 등)을 시뮬레이션한다.
// (실제 react-native-biometrics 잠금 컴포넌트 테스트에서도 검증된 패턴.)
function emitAppStateChange(nextState: string) {
  const addEventListenerMock = AppState.addEventListener as jest.Mock;
  const [, listener] = addEventListenerMock.mock.calls[
    addEventListenerMock.mock.calls.length - 1
  ] as [string, (state: string) => void];
  listener(nextState);
}

describe('PrivacyScreenCover', () => {
  beforeEach(() => {
    jest.spyOn(AppState, 'addEventListener');
    Object.defineProperty(AppState, 'currentState', {
      value: 'active',
      configurable: true,
    });
  });

  it('active 상태에서는 커버를 씌우지 않고 children을 그대로 보여준다', async () => {
    await render(
      <PrivacyScreenCover>
        <Text>영수증 목록</Text>
      </PrivacyScreenCover>,
    );

    expect(screen.getByText('영수증 목록')).toBeTruthy();
    expect(screen.queryByTestId('privacy-screen-cover')).toBeNull();
  });

  it('background로 전환되면 커버로 화면을 가린다', async () => {
    await render(
      <PrivacyScreenCover>
        <Text>영수증 목록</Text>
      </PrivacyScreenCover>,
    );

    emitAppStateChange('background');

    await waitFor(() => {
      expect(screen.getByTestId('privacy-screen-cover')).toBeTruthy();
    });
  });

  it('inactive로 전환되어도 커버로 화면을 가린다 (iOS는 inactive 시점에 스냅샷을 찍음)', async () => {
    await render(
      <PrivacyScreenCover>
        <Text>영수증 목록</Text>
      </PrivacyScreenCover>,
    );

    emitAppStateChange('inactive');

    await waitFor(() => {
      expect(screen.getByTestId('privacy-screen-cover')).toBeTruthy();
    });
  });

  it('background에서 다시 active로 돌아오면 커버를 없앤다', async () => {
    await render(
      <PrivacyScreenCover>
        <Text>영수증 목록</Text>
      </PrivacyScreenCover>,
    );

    emitAppStateChange('background');
    await waitFor(() => {
      expect(screen.getByTestId('privacy-screen-cover')).toBeTruthy();
    });

    emitAppStateChange('active');
    await waitFor(() => {
      expect(screen.queryByTestId('privacy-screen-cover')).toBeNull();
    });
  });
});
