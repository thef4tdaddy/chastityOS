import { useNotificationStore } from './src/stores/notificationStore.ts';
import { logger } from './src/utils/logging.ts';

const { showError, showWarning } = useNotificationStore.getState();
const errorId = showError("Test error");
const warningId = showWarning("Test warning");

const { notifications } = useNotificationStore.getState();
logger.debug("Error notification", { notification: notifications.find(n => n.id === errorId) });
logger.debug("Warning notification", { notification: notifications.find(n => n.id === warningId) });
