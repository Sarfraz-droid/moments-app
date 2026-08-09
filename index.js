import 'expo-router/entry';

import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { registerBackgroundNotificationTask } from '@/lib/background-notifications';
import { widgetTaskHandler } from '@/widgets/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
registerBackgroundNotificationTask();
