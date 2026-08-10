import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { toggleReaction } from '@/lib/reactions';
import { supabase } from '@/lib/supabase';
import {
  readLatestMomentForWidget,
  refreshCachedMomentReactions,
  syncLatestMomentToWidget,
  WIDGET_PAIR_ID_KEY,
} from '@/lib/widget-cache';
import { AddMomentWidget } from '@/widgets/add-moment-widget';
import { MomentWidget } from '@/widgets/moment-widget';

// Widget add/update events refresh the snapshot from the server. Other events
// render from AsyncStorage so resize and click interactions stay responsive.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const isAddMomentWidget = props.widgetInfo.widgetName === 'AddMomentWidget';

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      if (isAddMomentWidget) {
        props.renderWidget(<AddMomentWidget />);
        break;
      }

      // WIDGET_ADDED must not rely on a snapshot created before the widget
      // existed. WIDGET_UPDATE is also Android's periodic fallback when a
      // realtime subscription or background push was missed. Refresh from the
      // server for both events, but keep resize handling cache-only so dragging
      // the widget never causes a network request.
      if (props.widgetAction !== 'WIDGET_RESIZED') {
        const pairId = await AsyncStorage.getItem(WIDGET_PAIR_ID_KEY);
        if (pairId) {
          await syncLatestMomentToWidget(pairId).catch(() => {});
        }
      }
      const latest = await readLatestMomentForWidget();
      props.renderWidget(<MomentWidget moment={latest} />);
      break;
    }
    case 'WIDGET_CLICK': {
      if (isAddMomentWidget) {
        // OPEN_URI is handled natively by the library before this fires;
        // nothing else to do here.
        props.renderWidget(<AddMomentWidget />);
        break;
      }
      const { emoji, momentId, pairId } = props.clickActionData ?? {};
      if (typeof emoji === 'string' && typeof momentId === 'string' && typeof pairId === 'string') {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await toggleReaction(momentId, pairId, user.id, emoji);
          await refreshCachedMomentReactions(user.id);
        }
      }
      const latest = await readLatestMomentForWidget();
      props.renderWidget(<MomentWidget moment={latest} />);
      break;
    }
    default:
      break;
  }
}
