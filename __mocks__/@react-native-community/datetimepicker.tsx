// 실제 패키지는 네이티브 모듈(TurboModuleRegistry)에 의존해서 Jest 환경에서 그대로
// import하면 죽는다(react-native-keyboard-controller/reanimated와 동일한 문제).
// 테스트에서 픽커 상호작용을 흉내낼 수 있도록 최소한의 수동 목만 제공한다.
import React from 'react';
import { TextInput } from 'react-native';

interface MockDateTimePickerProps {
  testID?: string;
  value: Date;
  onChange?: (
    event: { type: 'set' | 'dismissed' },
    date?: Date,
  ) => void;
}

// value를 ISO 문자열로 보여주고, 그 텍스트를 바꾸면(=테스트에서 changeText) 새 날짜를
// 고른 것처럼 onChange를 호출한다.
function DateTimePicker({
  testID = 'date-picker-native',
  value,
  onChange,
}: MockDateTimePickerProps) {
  return (
    <TextInput
      testID={testID}
      value={value.toISOString()}
      onChangeText={text => {
        const date = new Date(text);
        onChange?.({ type: 'set' }, date);
      }}
    />
  );
}

export const DateTimePickerAndroid = {
  open: jest.fn(),
  dismiss: jest.fn(),
};

export default DateTimePicker;
