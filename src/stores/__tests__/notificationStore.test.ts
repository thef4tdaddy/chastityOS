/**
 * NotificationStore Tests
 * Unit tests for NotificationStore functionality
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useNotificationStore } from "../notificationStore";

// Mock timers
vi.useFakeTimers();

describe("NotificationStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useNotificationStore.getState().clearAllNotifications();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Basic Notification Management", () => {
    it("should start with empty notifications", () => {
      const { notifications } = useNotificationStore.getState();
      expect(notifications).toEqual([]);
    });

    it("should add a notification", () => {
      const { addNotification } = useNotificationStore.getState();

      const id = addNotification({
        type: "info",
        message: "Test notification",
      });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.id).toBe(id);
      expect(notifications[0]?.message).toBe("Test notification");
      expect(notifications[0]?.type).toBe("info");
    });

    it("should remove a notification", () => {
      const { addNotification, removeNotification } =
        useNotificationStore.getState();

      const id = addNotification({
        type: "info",
        message: "Test notification",
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      removeNotification(id);
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("should clear all notifications", () => {
      const { addNotification, clearAllNotifications } =
        useNotificationStore.getState();

      addNotification({ type: "info", message: "Test 1" });
      addNotification({ type: "success", message: "Test 2" });

      expect(useNotificationStore.getState().notifications).toHaveLength(2);

      clearAllNotifications();
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe("Notification Types", () => {
    it("should create success notification", () => {
      const { showSuccess } = useNotificationStore.getState();

      const id = showSuccess("Success message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe("success");
      expect(notifications[0]?.message).toBe("Success message");
    });

    it("should create error notification", () => {
      const { showError } = useNotificationStore.getState();

      const id = showError("Error message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe("error");
      expect(notifications[0]?.message).toBe("Error message");
      // showError passes undefined duration, which overrides the default
      expect(notifications[0]?.duration).toBeUndefined();
    });

    it("should create warning notification", () => {
      const { showWarning } = useNotificationStore.getState();

      const id = showWarning("Warning message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe("warning");
      expect(notifications[0]?.message).toBe("Warning message");
      // showWarning passes undefined duration, which overrides the default
      expect(notifications[0]?.duration).toBeUndefined();
    });

    it("should create info notification", () => {
      const { showInfo } = useNotificationStore.getState();

      const id = showInfo("Info message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe("info");
      expect(notifications[0]?.message).toBe("Info message");
    });

    it("should create custom notification with duration 0", () => {
      const { addNotification } = useNotificationStore.getState();

      const id = addNotification({
        type: "info",
        message: "Loading message",
        duration: 0,
        dismissible: false,
      });
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0]?.type).toBe("info");
      expect(notifications[0]?.message).toBe("Loading message");
      expect(notifications[0]?.duration).toBe(0); // Custom notifications can have duration 0
      expect(notifications[0]?.dismissible).toBe(false);
    });
  });

  describe("Auto-dismiss", () => {
    it("should auto-dismiss notification after duration", () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: "info",
        message: "Test notification",
        duration: 1000,
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("should not auto-dismiss notification with duration 0", () => {
      const { addNotification } = useNotificationStore.getState();

      addNotification({
        type: "info",
        message: "Test notification",
        duration: 0,
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });
  });

  describe("Query Methods", () => {
    it("should check if has notifications", () => {
      const { addNotification, notifications } =
        useNotificationStore.getState();

      expect(notifications.length > 0).toBe(false);

      addNotification({ type: "info", message: "Test" });
      expect(useNotificationStore.getState().notifications.length > 0).toBe(
        true,
      );
    });

    it("should get notification by id", () => {
      const { addNotification } = useNotificationStore.getState();

      const id = addNotification({
        type: "info",
        message: "Test notification",
      });

      const { notifications } = useNotificationStore.getState();
      const notification = notifications.find((n) => n.id === id);
      expect(notification).toBeDefined();
      expect(notification?.id).toBe(id);
      expect(notification?.message).toBe("Test notification");
    });
  });

  describe("Update Notifications", () => {
    it("should update notification", () => {
      const { addNotification, updateNotification } =
        useNotificationStore.getState();

      const id = addNotification({ type: "info", message: "Original message" });

      updateNotification(id, { message: "Updated message", type: "success" });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0]?.message).toBe("Updated message");
      expect(notifications[0]?.type).toBe("success");
    });
  });
});
