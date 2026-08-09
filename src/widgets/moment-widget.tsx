import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

import type { WidgetMoment } from '@/lib/widget-cache';

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function MomentWidget({ moment }: { moment: WidgetMoment | null }) {
  if (!moment) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#208AEF',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
        }}>
        <TextWidget text="Koi moment nahi abhi 💛" style={{ fontSize: 14, color: '#FFFFFF' }} />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#000000',
        borderRadius: 20,
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
      <FlexWidget style={{ flex: 1, width: 'match_parent' }}>
        {moment.type === 'photo' && moment.photoUri ? (
          <ImageWidget
            image={moment.photoUri as `https:${string}`}
            imageWidth={300}
            imageHeight={300}
            resizeMode="cover"
            style={{ height: 'match_parent', width: 'match_parent' }}
          />
        ) : (
          <FlexWidget
            style={{
              height: 'match_parent',
              width: 'match_parent',
              backgroundColor: '#212225',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}>
            <TextWidget
              text={moment.text ?? ''}
              style={{ fontSize: 16, color: '#FFFFFF', textAlign: 'center' }}
            />
          </FlexWidget>
        )}
      </FlexWidget>
      <FlexWidget style={{ width: 'match_parent', padding: 8, backgroundColor: '#00000099' }}>
        <TextWidget
          text={`${moment.senderName} · ${timeAgo(moment.createdAt)}`}
          style={{ fontSize: 11, color: '#FFFFFF' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
