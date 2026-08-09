import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { readLatestMomentForWidget } from '@/lib/widget-cache';
import { MomentWidget } from '@/widgets/moment-widget';

// Renders from the AsyncStorage snapshot only (no network call) — the app keeps
// that snapshot fresh via syncLatestMomentToWidget (foreground + background push handler).
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const latest = await readLatestMomentForWidget();
      props.renderWidget(<MomentWidget moment={latest} />);
      break;
    }
    default:
      break;
  }
}
