// react-native-android-widget renders these as plain functions outside React's
// tree; the React 19 compiler's auto-memoization breaks that (invalid hook call).
'use no memo';

import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import type { ImageWidgetSource } from 'react-native-android-widget';

import { Brand } from '@/constants/theme';
import type { WidgetMoment } from '@/lib/widget-cache';

export function MomentWidget({ moment }: { moment: WidgetMoment | null }) {
  if (!moment) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
        }}>
        <FlexWidget
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: Brand.gradientStart,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <TextWidget text="M" style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' }} />
        </FlexWidget>
        <TextWidget
          text="No moments yet"
          style={{ fontSize: 14, color: '#222220', fontWeight: '600', marginTop: 8 }}
        />
        <TextWidget text="Open Moments to send one" style={{ fontSize: 11, color: '#6F6F6B', marginTop: 2 }} />
      </FlexWidget>
    );
  }

  const reactions = moment.reactions ?? [];
  const heart = reactions.find((reaction) => reaction.emoji === '❤️') ?? {
    emoji: '❤️',
    count: 0,
    mine: false,
  };
  const primaryReaction = reactions.find((reaction) => reaction.mine) ?? heart;
  const visibleReactions = [
    primaryReaction,
    ...reactions.filter(
      (reaction) => reaction.emoji !== primaryReaction.emoji && reaction.count > 0
    ),
  ];

  const badges: { key: string; icon: string; label: string }[] = [];
  if (moment.isVideo) badges.push({ key: 'video', icon: '▶', label: 'Video' });
  if (moment.trackTitle) badges.push({ key: 'track', icon: '🎵', label: moment.trackTitle });
  const badgeWidth = badges.length > 1 ? 55 : 80;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
      <FlexWidget style={{ flex: 1, width: 'match_parent' }}>
        {moment.photoUri ? (
          <ImageWidget
            image={moment.photoUri as ImageWidgetSource}
            imageWidth={180}
            imageHeight={180}
            resizeMode="cover"
            style={{ height: 'match_parent', width: 'match_parent' }}
          />
        ) : (
          <FlexWidget
            style={{
              height: 'match_parent',
              width: 'match_parent',
              backgroundColor: '#F7F7F5',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}>
            <TextWidget
              text={moment.text ?? ''}
              style={{ fontSize: 17, color: '#222220', textAlign: 'center', fontWeight: '500' }}
            />
          </FlexWidget>
        )}
      </FlexWidget>
      <FlexWidget
        style={{
          width: 'match_parent',
          paddingHorizontal: 10,
          paddingVertical: 4,
          backgroundColor: '#FFFFFF',
          flexDirection: 'column',
        }}>
        {moment.photoUri && moment.text ? (
          <TextWidget
            text={moment.text}
            maxLines={2}
            truncate="END"
            style={{ fontSize: 12, color: '#222220', fontWeight: '500', marginBottom: 3 }}
          />
        ) : null}
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <FlexWidget style={{ flex: 1, flexDirection: 'row', flexGap: 4 }}>
            {badges.map((badge) => (
              <FlexWidget
                key={badge.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: badgeWidth,
                  overflow: 'hidden',
                  backgroundColor: '#F5F5F3',
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}>
                <TextWidget text={badge.icon} style={{ fontSize: 10, marginRight: 4 }} />
                <TextWidget
                  text={badge.label}
                  maxLines={1}
                  truncate="END"
                  style={{ fontSize: 10, color: '#6F6F6B', fontWeight: '600' }}
                />
              </FlexWidget>
            ))}
          </FlexWidget>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
            <FlexWidget
              clickAction={primaryReaction.emoji}
              clickActionData={{
                emoji: primaryReaction.emoji,
                momentId: moment.momentId,
                pairId: moment.pairId,
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: primaryReaction.mine ? '#FFF0ED' : '#F5F5F3',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <TextWidget
                text={
                  primaryReaction.count > 0
                    ? `${primaryReaction.emoji} ${primaryReaction.count}`
                    : primaryReaction.emoji
                }
                style={{
                  fontSize: primaryReaction.count > 0 ? 11 : 15,
                  color: Brand.gradientStart,
                }}
              />
            </FlexWidget>
            <FlexWidget
              clickAction="OPEN_URI"
              clickActionData={{ uri: 'homescreennotifiers://camera' }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: Brand.gradientStart,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <TextWidget text="+" style={{ fontSize: 21, color: '#FFFFFF', fontWeight: '500' }} />
            </FlexWidget>
          </FlexWidget>
        </FlexWidget>
        {visibleReactions.length > 1 ? (
          <FlexWidget style={{ flexDirection: 'row', flexGap: 4, marginTop: 3 }}>
            {visibleReactions.slice(1).map((reaction) => (
              <FlexWidget
                key={reaction.emoji}
                clickAction={reaction.emoji}
                clickActionData={{
                  emoji: reaction.emoji,
                  momentId: moment.momentId,
                  pairId: moment.pairId,
                }}
                style={{
                  backgroundColor: reaction.mine ? '#FFF0ED' : '#F5F5F3',
                  borderRadius: 12,
                  padding: 4,
                }}>
                <TextWidget
                  text={`${reaction.emoji}${reaction.count}`}
                  style={{ fontSize: 12, color: reaction.mine ? Brand.gradientStart : '#222220' }}
                />
              </FlexWidget>
            ))}
          </FlexWidget>
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}
