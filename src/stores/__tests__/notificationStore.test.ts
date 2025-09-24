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
    useNotificationStore.getState().resetStore();
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
      expect(notifications[0].id).toBe(id);
      expect(notifications[0].message).toBe("Test notification");
      expect(notifications[0].type).toBe("info");
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
      const { addNotification, clearNotifications } =
        useNotificationStore.getState();

      addNotification({ type: "info", message: "Test 1" });
      addNotification({ type: "success", message: "Test 2" });

      expect(useNotificationStore.getState().notifications).toHaveLength(2);

      clearNotifications();
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });
  });

  describe("Notification Types", () => {
    it("should create success notification", () => {
      const { success } = useNotificationStore.getState();

      const id = success("Success message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe("success");
      expect(notifications[0].message).toBe("Success message");
    });

    it("should create error notification", () => {
      const { error } = useNotificationStore.getState();

      const id = error("Error message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe("error");
      expect(notifications[0].message).toBe("Error message");
      expect(notifications[0].duration).toBe(8000); // Errors stay longer
    });

    it("should create warning notification", () => {
      const { warning } = useNotificationStore.getState();

      const id = warning("Warning message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe("warning");
      expect(notifications[0].message).toBe("Warning message");
      expect(notifications[0].duration).toBe(7000); // Warnings stay longer
    });

    it("should create info notification", () => {
      const { info } = useNotificationStore.getState();

      const id = info("Info message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe("info");
      expect(notifications[0].message).toBe("Info message");
    });

    it("should create loading notification", () => {
      const { loading } = useNotificationStore.getState();

      const id = loading("Loading message");
      const { notifications } = useNotificationStore.getState();

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe("loading");
      expect(notifications[0].message).toBe("Loading message");
      expect(notifications[0].duration).toBe(0); // Loading notifications don't auto-dismiss
      expect(notifications[0].dismissible).toBe(false);
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

  describe("Max Notifications", () => {
    it("should respect max notifications limit", () => {
      const { addNotification, setMaxNotifications } =
        useNotificationStore.getState();

      setMaxNotifications(2);

      addNotification({ type: "info", message: "Test 1" });
      addNotification({ type: "info", message: "Test 2" });
      addNotification({ type: "info", message: "Test 3" });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(2);
      expect(notifications[0].message).toBe("Test 2");
      expect(notifications[1].message).toBe("Test 3");
    });
  });

  describe("Filter by Type", () => {
    it("should clear notifications by type", () => {
      const { addNotification, clearByType } = useNotificationStore.getState();

      addNotification({ type: "info", message: "Info 1" });
      addNotification({ type: "error", message: "Error 1" });
      addNotification({ type: "info", message: "Info 2" });

      expect(useNotificationStore.getState().notifications).toHaveLength(3);

      clearByType("info");

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe("error");
    });

    it("should get notifications by type", () => {
      const { addNotification, getNotificationsByType } =
        useNotificationStore.getState();

      addNotification({ type: "info", message: "Info 1" });
      addNotification({ type: "error", message: "Error 1" });
      addNotification({ type: "info", message: "Info 2" });

      const infoNotifications = getNotificationsByType("info");
      expect(infoNotifications).toHaveLength(2);
      expect(infoNotifications.every((n) => n.type === "info")).toBe(true);
    });
  });

  describe("Query Methods", () => {
    it("should check if has notifications", () => {
      const { addNotification, hasNotifications } =
        useNotificationStore.getState();

      expect(hasNotifications()).toBe(false);

      addNotification({ type: "info", message: "Test" });
      expect(hasNotifications()).toBe(true);
    });

    it("should get notification by id", () => {
      const { addNotification, getNotification } =
        useNotificationStore.getState();

      const id = addNotification({
        type: "info",
        message: "Test notification",
      });

      const notification = getNotification(id);
      expect(notification).toBeDefined();
      expect(notification!.id).toBe(id);
      expect(notification!.message).toBe("Test notification");
    });
  });

  describe("Update Notifications", () => {
    it("should update notification", () => {
      const { addNotification, updateNotification } =
        useNotificationStore.getState();

      const id = addNotification({ type: "info", message: "Original message" });

      updateNotification(id, { message: "Updated message", type: "success" });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].message).toBe("Updated message");
      expect(notifications[0].type).toBe("success");
    });
  });
});
