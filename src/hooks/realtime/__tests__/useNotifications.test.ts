/**
 * Tests for useNotifications hook
 */
import { renderHook, act } from "@testing-library/react";
import { vi, beforeAll, afterAll, describe, it, expect } from "vitest";
import { useNotifications } from "../useNotifications";
import {
  NotificationType,
  NotificationPriority,
} from "../../../types/realtime";

// Mock console.log to avoid test noise
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = vi.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe("useNotifications", () => {
  const mockUserId = "test-user-123";

  it("should initialize with default state", async () => {
    const { result } = renderHook(() =>
      useNotifications({ userId: mockUserId }),
    );

    expect(result.current.loading).toBe(true);

    // Wait for initialization
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.notifications).toBeDefined();
    expect(Array.isArray(result.current.notifications)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("should show success notifications", async () => {
    const { result } = renderHook(() =>
      useNotifications({ userId: mockUserId }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await act(async () => {
      await result.current.showSuccess(
        "Test Success",
        "This is a test success message",
      );
    });

    expect(result.current.notifications.length).toBeGreaterThan(0);
    const notification = result.current.notifications[0]!;
    expect(notification.type).toBe(NotificationType.SUCCESS);
    expect(notification.title).toBe("Test Success");
    expect(notification.message).toBe("This is a test success message");
  });

  it("should show error notifications", async () => {
    const { result } = renderHook(() =>
      useNotifications({ userId: mockUserId }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await act(async () => {
      await result.current.showError(
        "Test Error",
        "This is a test error message",
      );
    });

    expect(result.current.notifications.length).toBeGreaterThan(0);
    const notification = result.current.notifications[0]!;
    expect(notification.type).toBe(NotificationType.ERROR);
    expect(notification.priority).toBe(NotificationPriority.HIGH);
  });

  it("should mark notifications as read", async () => {
    const { result } = renderHook(() =>
      useNotifications({ userId: mockUserId }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Add a notification
    await act(async () => {
      await result.current.showInfo("Test Info", "This is a test info message");
    });

    const notificationId = result.current.notifications[0]!.id;
    expect(result.current.notifications[0]!.isRead).toBe(false);
    expect(result.current.unreadCount).toBe(1);

    // Mark as read
    await act(async () => {
      await result.current.markAsRead(notificationId);
    });

    expect(result.current.notifications[0]!.isRead).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("should dismiss notifications", async () => {
    const { result } = renderHook(() =>
      useNotifications({ userId: mockUserId }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Add a notification
    await act(async () => {
      await result.current.showWarning(
        "Test Warning",
        "This is a test warning message",
      );
    });

    const notificationId = result.current.notifications[0]!.id;
    expect(result.current.notifications.length).toBe(1);

    // Dismiss notification
    await act(async () => {
      await result.current.dismissNotification(notificationId);
    });

    expect(result.current.notifications.length).toBe(0);
  });
});
