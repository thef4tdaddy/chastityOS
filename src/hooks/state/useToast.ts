/**
 * useToast Hook - Toast notification wrapper
 * Wraps the notification store to provide a simple toast interface
 */
import { useNotificationStore } from "../../stores";

export interface UseToastReturn {
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
}

export const useToast = (): UseToastReturn => {
  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const showWarning = useNotificationStore((state) => state.showWarning);
  const showInfo = useNotificationStore((state) => state.showInfo);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
