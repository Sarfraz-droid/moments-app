import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { toggleReaction } from '@/lib/reactions';
import { supabase } from '@/lib/supabase';
import { readLatestMomentForWidget, refreshCachedMomentReactions } from '@/lib/widget-cache';
import { AddMomentWidget } from '@/widgets/add-moment-widget';
import { MomentWidget } from '@/widgets/moment-widget';

// Renders from the AsyncStorage snapshot only (no network call) — the app keeps
// that snapshot fresh via syncLatestMomentToWidget (foreground + background push handler).
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
