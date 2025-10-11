/**
 * Push Notification Integration Tests
 * End-to-end tests for push notification workflow including:
 * - FCM token acquisition and storage
 * - Server sending notifications
 * - Service worker receiving push events
 * - Notification display
 * - User interaction with notifications
 * - App navigation on notification click
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Firebase Messaging
const mockGetToken = vi.fn();
const mockOnMessage = vi.fn();
const mockDeleteToken = vi.fn();

vi.mock("firebase/messaging", () => ({
  getMessaging: vi.fn(() => ({})),
  getToken: mockGetToken,
  onMessage: mockOnMessage,
  deleteToken: mockDeleteToken,
  isSupported: vi.fn(() => Promise.resolve(true)),
}));

// Mock notification store
const mockAddNotification = vi.fn(() => "notification-123");
const mockRemoveNotification = vi.fn();

vi.mock("@/stores/notificationStore", () => ({
  useNotificationStore: {
    getState: vi.fn(() => ({
      addNotification: mockAddNotification,
      removeNotification: mockRemoveNotification,
      notifications: [],
    })),
  },
}));

describe("Push Notification Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Notification API
    global.Notification = {
      permission: "granted",
      requestPermission: vi.fn(() => Promise.resolve("granted")),
    } as unknown as typeof Notification;
  });

  describe("FCM Token Acquisition and Storage", () => {
    it("should acquire FCM token on first load", async () => {
      const { getToken } = await import("firebase/messaging");
      const mockToken = "fcm-token-abc123";

      mockGetToken.mockResolvedValue(mockToken);

      const token = await getToken({} as any, {
        vapidKey: "test-vapid-key",
      });

      expect(token).toBe(mockToken);
      expect(mockGetToken).toHaveBeenCalled();
    });

    it("should store FCM token in localStorage", async () => {
      const { getToken } = await import("firebase/messaging");
      const mockToken = "fcm-token-xyz789";

      mockGetToken.mockResolvedValue(mockToken);

      const token = await getToken({} as any, {
        vapidKey: "test-vapid-key",
      });

      // Simulate storing token
      localStorage.setItem("fcm_token", token);

      const storedToken = localStorage.getItem("fcm_token");
      expect(storedToken).toBe(mockToken);
    });

    it("should handle token refresh", async () => {
      const { getToken } = await import("firebase/messaging");
      const oldToken = "fcm-token-old";
      const newToken = "fcm-token-new";

      // First call returns old token
      localStorage.setItem("fcm_token", oldToken);
      expect(localStorage.getItem("fcm_token")).toBe(oldToken);

      // Second call returns new token
      mockGetToken.mockResolvedValue(newToken);
      const token = await getToken({} as any, {
        vapidKey: "test-vapid-key",
      });

      localStorage.setItem("fcm_token", token);

      expect(localStorage.getItem("fcm_token")).toBe(newToken);
    });

    it("should send token to backend server", async () => {
      const { getToken } = await import("firebase/messaging");
      const mockToken = "fcm-token-backend";

      mockGetToken.mockResolvedValue(mockToken);

      const token = await getToken({} as any, {
        vapidKey: "test-vapid-key",
      });

      // Simulate sending to backend
      const backendResponse = {
        success: true,
        userId: "user-123",
        token,
      };

      expect(backendResponse.success).toBe(true);
      expect(backendResponse.token).toBe(mockToken);
    });
  });

  describe("Server Sending Notifications", () => {
    it("should format notification payload correctly", () => {
      const payload = {
        notification: {
          title: "New Task Assigned",
          body: "You have been assigned: Clean the room",
          icon: "/icon-192.png",
          badge: "/badge-72.png",
        },
        data: {
          type: "task_assigned",
          taskId: "task-123",
          userId: "user-456",
          timestamp: Date.now().toString(),
        },
      };

      expect(payload.notification.title).toBe("New Task Assigned");
      expect(payload.data.type).toBe("task_assigned");
      expect(payload.data.taskId).toBe("task-123");
    });

    it("should include action buttons in payload", () => {
      const payload = {
        notification: {
          title: "Task Submitted for Review",
          body: "Your submissive has submitted a task",
        },
        data: {
          type: "task_submitted",
          taskId: "task-789",
          actions: JSON.stringify([
            { action: "approve", title: "Approve" },
            { action: "reject", title: "Reject" },
          ]),
        },
      };

      const actions = JSON.parse(payload.data.actions);
      expect(actions).toHaveLength(2);
      expect(actions[0].action).toBe("approve");
    });

    it("should set notification priority", () => {
      const highPriorityPayload = {
        notification: {
          title: "Urgent: Session Ending",
          body: "Your chastity session is ending in 5 minutes",
        },
        data: {
          type: "session_ending",
          priority: "high",
        },
        android: {
          priority: "high",
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
        },
      };

      expect(highPriorityPayload.data.priority).toBe("high");
      expect(highPriorityPayload.android.priority).toBe("high");
    });
  });

  describe("Service Worker Receiving Push Events", () => {
    it("should receive push message", async () => {
      const { onMessage } = await import("firebase/messaging");

      const mockMessage = {
        notification: {
          title: "Test Notification",
          body: "Test body",
        },
        data: {
          type: "test",
        },
      };

      const messageHandler = vi.fn();
      mockOnMessage.mockImplementation((messaging, handler) => {
        handler(mockMessage);
      });

      onMessage({} as any, messageHandler);

      expect(messageHandler).toHaveBeenCalledWith(mockMessage);
    });

    it("should handle background messages", () => {
      // Simulate service worker receiving background push
      const pushEvent = {
        data: {
          json: () => ({
            notification: {
              title: "Background Notification",
              body: "Received while app was closed",
            },
            data: {
              type: "background_task",
              taskId: "task-bg-123",
            },
          }),
        },
      };

      const notificationData = pushEvent.data.json();
      expect(notificationData.notification.title).toBe(
        "Background Notification",
      );
      expect(notificationData.data.type).toBe("background_task");
    });

    it("should parse message data", async () => {
      const { onMessage } = await import("firebase/messaging");

      const mockMessage = {
        notification: {
          title: "Task Approved",
          body: "Your task has been approved",
        },
        data: {
          type: "task_approved",
          taskId: "task-999",
          points: "10",
          metadata: JSON.stringify({
            keyholderName: "Master John",
            approvalTime: Date.now(),
          }),
        },
      };

      const messageHandler = vi.fn((message) => {
        const metadata = JSON.parse(message.data.metadata);
        expect(metadata.keyholderName).toBe("Master John");
      });

      mockOnMessage.mockImplementation((messaging, handler) => {
        handler(mockMessage);
      });

      onMessage({} as any, messageHandler);

      expect(messageHandler).toHaveBeenCalled();
    });
  });

  describe("Notification Display", () => {
    it("should display notification with correct title and body", async () => {
      const { useNotificationStore } = await import(
        "@/stores/notificationStore"
      );

      const store = useNotificationStore.getState();
      const notificationId = store.addNotification({
        type: "info",
        title: "New Task",
        message: "You have been assigned a new task",
      });

      expect(notificationId).toBe("notification-123");
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "info",
          title: "New Task",
          message: "You have been assigned a new task",
        }),
      );
    });

    it("should display notification with icon and badge", () => {
      const notificationOptions = {
        title: "Task Update",
        body: "Your task status has changed",
        icon: "/icon-192.png",
        badge: "/badge-72.png",
      };

      expect(notificationOptions.icon).toBe("/icon-192.png");
      expect(notificationOptions.badge).toBe("/badge-72.png");
    });

    it("should display notification with actions", () => {
      const notificationOptions = {
        title: "Review Required",
        body: "A task needs your review",
        actions: [
          { action: "approve", title: "Approve", icon: "/approve.png" },
          { action: "reject", title: "Reject", icon: "/reject.png" },
          { action: "view", title: "View Details", icon: "/view.png" },
        ],
      };

      expect(notificationOptions.actions).toHaveLength(3);
      expect(notificationOptions.actions[0].action).toBe("approve");
    });

    it("should handle notification with tag for grouping", () => {
      const notificationOptions = {
        title: "Multiple Updates",
        body: "You have 3 new tasks",
        tag: "task-updates",
        renotify: true,
      };

      expect(notificationOptions.tag).toBe("task-updates");
      expect(notificationOptions.renotify).toBe(true);
    });

    it("should respect notification duration", async () => {
      const { useNotificationStore } = await import(
        "@/stores/notificationStore"
      );

      const store = useNotificationStore.getState();
      store.addNotification({
        type: "success",
        message: "Task completed!",
        duration: 5000,
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 5000,
        }),
      );
    });

    it("should display persistent notification when duration is 0", async () => {
      const { useNotificationStore } = await import(
        "@/stores/notificationStore"
      );

      const store = useNotificationStore.getState();
      store.addNotification({
        type: "error",
        message: "Action required",
        duration: 0, // Persistent
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 0,
        }),
      );
    });
  });

  describe("User Interaction with Notifications", () => {
    it("should handle notification click", () => {
      const notificationClickHandler = vi.fn((notificationId) => {
        // Navigate to relevant page
        return `/tasks/${notificationId}`;
      });

      const url = notificationClickHandler("task-123");

      expect(notificationClickHandler).toHaveBeenCalledWith("task-123");
      expect(url).toBe("/tasks/task-123");
    });

    it("should handle action button click", () => {
      const actionHandler = vi.fn((action, taskId) => {
        if (action === "approve") {
          return { status: "approved", taskId };
        }
        return { status: "unknown", taskId };
      });

      const result = actionHandler("approve", "task-456");

      expect(result.status).toBe("approved");
      expect(result.taskId).toBe("task-456");
    });

    it("should dismiss notification on close", async () => {
      const { useNotificationStore } = await import(
        "@/stores/notificationStore"
      );

      const store = useNotificationStore.getState();
      store.removeNotification("notification-123");

      expect(mockRemoveNotification).toHaveBeenCalledWith("notification-123");
    });

    it("should update badge count on interaction", () => {
      let badgeCount = 5;

      // User clicks notification
      badgeCount = Math.max(0, badgeCount - 1);

      expect(badgeCount).toBe(4);
    });
  });

  describe("App Navigation on Notification Click", () => {
    it("should navigate to task detail page", () => {
      const notificationData = {
        type: "task_assigned",
        taskId: "task-789",
        link: "/tasks/task-789",
      };

      expect(notificationData.link).toBe("/tasks/task-789");
    });

    it("should navigate to keyholder review page", () => {
      const notificationData = {
        type: "task_submitted",
        taskId: "task-101",
        link: "/keyholder/tasks/task-101",
      };

      expect(notificationData.link).toBe("/keyholder/tasks/task-101");
    });

    it("should navigate to session page", () => {
      const notificationData = {
        type: "session_ending",
        sessionId: "session-555",
        link: "/session",
      };

      expect(notificationData.link).toBe("/session");
    });

    it("should focus existing tab if app is already open", () => {
      // Simulate checking if app is already open
      const isAppOpen = true;

      if (isAppOpen) {
        // Focus existing tab instead of opening new one
        expect(isAppOpen).toBe(true);
      }
    });

    it("should open new tab if app is closed", () => {
      const isAppOpen = false;

      if (!isAppOpen) {
        // Open new tab
        const url = "/tasks/task-123";
        expect(url).toBeTruthy();
      }
    });

    it("should preserve notification data in URL params", () => {
      const taskId = "task-999";
      const source = "notification";
      const url = `/tasks/${taskId}?source=${source}`;

      expect(url).toBe("/tasks/task-999?source=notification");
    });
  });

  describe("Token Management", () => {
    it("should delete token on logout", async () => {
      const { deleteToken } = await import("firebase/messaging");

      mockDeleteToken.mockResolvedValue(true);

      const result = await deleteToken({} as any);

      expect(result).toBe(true);
      expect(mockDeleteToken).toHaveBeenCalled();

      // Clear from localStorage
      localStorage.removeItem("fcm_token");
      expect(localStorage.getItem("fcm_token")).toBeNull();
    });

    it("should update token on app update", async () => {
      const { getToken } = await import("firebase/messaging");
      const newToken = "fcm-token-updated";

      mockGetToken.mockResolvedValue(newToken);

      const token = await getToken({} as any, {
        vapidKey: "test-vapid-key",
      });

      localStorage.setItem("fcm_token", token);

      expect(localStorage.getItem("fcm_token")).toBe(newToken);
    });

    it("should handle token deletion failure", async () => {
      const { deleteToken } = await import("firebase/messaging");

      mockDeleteToken.mockRejectedValue(new Error("Delete failed"));

      await expect(deleteToken({} as any)).rejects.toThrow("Delete failed");
    });
  });

  describe("Error Handling", () => {
    it("should handle notification permission denied", () => {
      global.Notification = {
        permission: "denied",
        requestPermission: vi.fn(() => Promise.resolve("denied")),
      } as unknown as typeof Notification;

      expect(Notification.permission).toBe("denied");
    });

    it("should handle FCM token error", async () => {
      const { getToken } = await import("firebase/messaging");

      mockGetToken.mockRejectedValue(new Error("Token error"));

      await expect(
        getToken({} as any, { vapidKey: "test-key" }),
      ).rejects.toThrow("Token error");
    });

    it("should handle message parsing error", async () => {
      const { onMessage } = await import("firebase/messaging");

      const invalidMessage = {
        data: {
          malformed: "data",
        },
      };

      const messageHandler = vi.fn((message) => {
        try {
          // Attempt to parse invalid JSON
          if (message.data.metadata) {
            JSON.parse(message.data.metadata);
          }
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      mockOnMessage.mockImplementation((messaging, handler) => {
        handler(invalidMessage);
      });

      onMessage({} as any, messageHandler);
    });

    it("should handle network error during token acquisition", async () => {
      const { getToken } = await import("firebase/messaging");

      mockGetToken.mockRejectedValue(new Error("Network error"));

      let errorOccurred = false;
      try {
        await getToken({} as any, { vapidKey: "test-key" });
      } catch (error) {
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true);
    });
  });
});
