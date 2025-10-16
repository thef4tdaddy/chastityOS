/**
 * Toast Bridge - Non-React services integration
 * Allows services like NotificationService to trigger toasts without React Context
 */
import { ToastContextValue, ToastOptions } from "../contexts/ToastProvider";
import { Notification } from "../stores/notificationStore";

type ShowToastFunction = ToastContextValue["showToast"];
type ShowConvenienceFunction = (
  message: string,
  options?: Omit<ToastOptions, "priority">,
) => string;

interface ToastBridge {
  // Core methods
  showToast: ShowToastFunction | null;
  dismissToast: ((id: string) => void) | null;
  clearAllToasts: (() => void) | null;

  // Convenience methods
  showSuccess: ShowConvenienceFunction | null;
  showError: ShowConvenienceFunction | null;
  showWarning: ShowConvenienceFunction | null;
  showInfo: ShowConvenienceFunction | null;
  showUrgent: ShowConvenienceFunction | null;
  showHigh: ShowConvenienceFunction | null;
  showMedium: ShowConvenienceFunction | null;
  showLow: ShowConvenienceFunction | null;

  // Registration method for React Context
  registerShowToast: (contextValue: ToastContextValue) => void;

  // Unregistration for cleanup
  unregisterShowToast: () => void;

  // Check if bridge is ready
  isReady: () => boolean;
}

class ToastBridgeImpl implements ToastBridge {
  public showToast: ShowToastFunction | null = null;
  public dismissToast: ((id: string) => void) | null = null;
  public clearAllToasts: (() => void) | null = null;

  public showSuccess: ShowConvenienceFunction | null = null;
  public showError: ShowConvenienceFunction | null = null;
  public showWarning: ShowConvenienceFunction | null = null;
  public showInfo: ShowConvenienceFunction | null = null;
  public showUrgent: ShowConvenienceFunction | null = null;
  public showHigh: ShowConvenienceFunction | null = null;
  public showMedium: ShowConvenienceFunction | null = null;
  public showLow: ShowConvenienceFunction | null = null;

  /**
   * Register toast functions from React Context
   * This should be called by ToastProvider when it mounts
   */
  public registerShowToast(contextValue: ToastContextValue): void {
    this.showToast = contextValue.showToast;
    this.dismissToast = contextValue.dismissToast;
    this.clearAllToasts = contextValue.clearAllToasts;
    this.showSuccess = contextValue.showSuccess;
    this.showError = contextValue.showError;
    this.showWarning = contextValue.showWarning;
    this.showInfo = contextValue.showInfo;
    this.showUrgent = contextValue.showUrgent;
    this.showHigh = contextValue.showHigh;
    this.showMedium = contextValue.showMedium;
    this.showLow = contextValue.showLow;

    // eslint-disable-next-line no-console
    console.debug("Toast bridge registered successfully");
  }

  /**
   * Unregister toast functions (cleanup)
   */
  public unregisterShowToast(): void {
    this.showToast = null;
    this.dismissToast = null;
    this.clearAllToasts = null;
    this.showSuccess = null;
    this.showError = null;
    this.showWarning = null;
    this.showInfo = null;
    this.showUrgent = null;
    this.showHigh = null;
    this.showMedium = null;
    this.showLow = null;

    // eslint-disable-next-line no-console
    console.debug("Toast bridge unregistered");
  }

  /**
   * Check if the bridge is ready to use
   */
  public isReady(): boolean {
    return this.showToast !== null;
  }
}

// Singleton instance
export const toastBridge = new ToastBridgeImpl();

/**
 * Safe wrapper functions for external services
 * These functions check if the bridge is ready before calling
 */
export const safeToastFunctions = {
  showToast: (
    message: string,
    type: Notification["type"],
    options?: ToastOptions,
  ): string | null => {
    if (toastBridge.isReady() && toastBridge.showToast) {
      return toastBridge.showToast(message, type, options);
    }
    // eslint-disable-next-line no-console
    console.warn("Toast bridge not ready. Toast message:", message);
    return null;
  },

  showSuccess: (
    message: string,
    options?: Omit<ToastOptions, "priority">,
  ): string | null => {
    if (toastBridge.isReady() && toastBridge.showSuccess) {
      return toastBridge.showSuccess(message, options);
    }
    // eslint-disable-next-line no-console
    console.warn("Toast bridge not ready. Success message:", message);
    return null;
  },

  showError: (
    message: string,
    options?: Omit<ToastOptions, "priority">,
  ): string | null => {
    if (toastBridge.isReady() && toastBridge.showError) {
      return toastBridge.showError(message, options);
    }
    // eslint-disable-next-line no-console
    console.error("Toast bridge not ready. Error message:", message);
    return null;
  },

  showWarning: (
    message: string,
    options?: Omit<ToastOptions, "priority">,
  ): string | null => {
    if (toastBridge.isReady() && toastBridge.showWarning) {
      return toastBridge.showWarning(message, options);
    }
    // eslint-disable-next-line no-console
    console.warn("Toast bridge not ready. Warning message:", message);
    return null;
  },

  showInfo: (
    message: string,
    options?: Omit<ToastOptions, "priority">,
  ): string | null => {
    if (toastBridge.isReady() && toastBridge.showInfo) {
      return toastBridge.showInfo(message, options);
    }
    // eslint-disable-next-line no-console
    console.info("Toast bridge not ready. Info message:", message);
    return null;
  },

  showUrgent: (
    message: string,
    options?: Omit<ToastOptions, "priority">,
  ): string | null => {
    if (toastBridge.isReady() && toastBridge.showUrgent) {
      return toastBridge.showUrgent(message, options);
    }
    // eslint-disable-next-line no-console
    console.error("Toast bridge not ready. Urgent message:", message);
    return null;
  },

  dismissToast: (id: string): void => {
    if (toastBridge.isReady() && toastBridge.dismissToast) {
      toastBridge.dismissToast(id);
    } else {
      // eslint-disable-next-line no-console
      console.warn("Toast bridge not ready. Cannot dismiss toast:", id);
    }
  },

  clearAllToasts: (): void => {
    if (toastBridge.isReady() && toastBridge.clearAllToasts) {
      toastBridge.clearAllToasts();
    } else {
      // eslint-disable-next-line no-console
      console.warn("Toast bridge not ready. Cannot clear toasts");
    }
  },
};

export default toastBridge;
