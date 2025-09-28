import { useNotificationStore } from './src/stores/notificationStore.ts';

const { showError, showWarning } = useNotificationStore.getState();
const errorId = showError("Test error");
const warningId = showWarning("Test warning");

const { notifications } = useNotificationStore.getState();
console.log("Error notification:", notifications.find(n => n.id === errorId));
console.log("Warning notification:", notifications.find(n => n.id === warningId));
