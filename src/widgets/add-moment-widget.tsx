'use no memo';

import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { Brand } from '@/constants/theme';

// Tapping opens the Send screen directly (deep link) — a real inline compose
// UI isn't possible: react-native-android-widget has no text-input component,
// and building one would mean hand-writing native RemoteViews+RemoteInput code.
export function AddMomentWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'homescreennotifiers://camera' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: Brand.gradientStart,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}>
      <TextWidget text="+" style={{ fontSize: 32, color: '#FFFFFF', fontWeight: '500' }} />
      <TextWidget
        text="Send a moment"
        style={{ fontSize: 12, color: '#FFFFFF', textAlign: 'center', marginTop: 2, fontWeight: '600' }}
      />
    </FlexWidget>
  );
}
