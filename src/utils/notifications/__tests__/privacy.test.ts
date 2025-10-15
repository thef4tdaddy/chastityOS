/**
 * Tests for notification privacy utilities
 */
import { describe, it, expect } from "vitest";
import {
  sanitizeNotificationContent,
  shouldSendNotification,
  generateUnsubscribeToken,
  parseUnsubscribeToken,
} from "../privacy";

describe("sanitizeNotificationContent", () => {
  it("should return original content when privacy mode is disabled", () => {
    const content = {
      title: "John's session completed",
      message: "John completed a 24 hour session",
      metadata: { submissiveName: "John" },
    };

    const result = sanitizeNotificationContent(content, false, false);

    expect(result).toEqual(content);
  });

  it("should sanitize personal names when privacy mode is enabled", () => {
    const content = {
      title: "John's session completed",
      message: "John completed a 24 hour session",
      metadata: { submissiveName: "John" },
    };

    const result = sanitizeNotificationContent(content, true, false);

    expect(result.title).not.toContain("John");
    expect(result.title).toContain("User");
    expect(result.message).not.toContain("John");
    expect(result.message).toContain("User");
    expect(result.metadata).not.toHaveProperty("submissiveName");
  });

  it("should use generic language for anonymous users", () => {
    const content = {
      title: "Your submissive started a session",
      message: "Your submissive has started a new chastity session",
      metadata: {},
    };

    const result = sanitizeNotificationContent(content, false, true);

    expect(result.title).not.toContain("Your submissive");
    expect(result.message).not.toContain("Your submissive");
  });

  it("should remove sensitive metadata fields", () => {
    const content = {
      title: "Task submitted",
      message: "A task was submitted",
      metadata: {
        submissiveName: "John",
        keyholderName: "Jane",
        email: "test@example.com",
        sessionId: "session123",
        link: "/tasks",
      },
    };

    const result = sanitizeNotificationContent(content, true, false);

    expect(result.metadata).not.toHaveProperty("submissiveName");
    expect(result.metadata).not.toHaveProperty("keyholderName");
    expect(result.metadata).not.toHaveProperty("email");
    // Should keep non-sensitive fields
    expect(result.metadata).toHaveProperty("sessionId");
    expect(result.metadata).toHaveProperty("link");
  });

  it("should sanitize time references in privacy mode", () => {
    const content = {
      title: "Session ending soon",
      message: "Your session will end in 30 minutes",
      metadata: {},
    };

    const result = sanitizeNotificationContent(content, true, false);

    expect(result.message).not.toContain("30 minutes");
    expect(result.message).toContain("some time");
  });
});

describe("shouldSendNotification", () => {
  it("should not send notification if user has opted out", () => {
    const result = shouldSendNotification(
      "session",
      { sessionNotifications: true },
      { optedOut: true },
    );

    expect(result).toBe(false);
  });

  it("should respect session notification preferences", () => {
    const result = shouldSendNotification(
      "session",
      { sessionNotifications: false },
      {},
    );

    expect(result).toBe(false);
  });

  it("should respect task notification preferences", () => {
    const result = shouldSendNotification(
      "task",
      { taskNotifications: false },
      {},
    );

    expect(result).toBe(false);
  });

  it("should allow notification by default if not explicitly disabled", () => {
    const result = shouldSendNotification("custom_notification", {}, {});

    expect(result).toBe(true);
  });

  it("should send notification if preferences allow it", () => {
    const result = shouldSendNotification(
      "session",
      { sessionNotifications: true },
      { optedOut: false },
    );

    expect(result).toBe(true);
  });
});

describe("generateUnsubscribeToken and parseUnsubscribeToken", () => {
  it("should generate and parse a valid token", () => {
    const userId = "user123";
    const notificationType = "session";

    const token = generateUnsubscribeToken(userId, notificationType);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");

    const parsed = parseUnsubscribeToken(token);
    expect(parsed).toBeTruthy();
    expect(parsed?.userId).toBe(userId);
    expect(parsed?.notificationType).toBe(notificationType);
    expect(typeof parsed?.timestamp).toBe("number");
  });

  it("should return null for invalid token", () => {
    const result = parseUnsubscribeToken("invalid-token");
    expect(result).toBeNull();
  });

  it("should return null for empty token", () => {
    const result = parseUnsubscribeToken("");
    expect(result).toBeNull();
  });

  it("should reject tokens with malformed data", () => {
    // Create a malformed token (missing parts)
    const malformedToken = btoa("user123:session"); // Missing timestamp
    const result = parseUnsubscribeToken(malformedToken);
    expect(result).toBeNull();
  });

  it("should reject expired tokens", () => {
    // Create a token with an old timestamp (more than 30 days)
    const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000; // 31 days ago
    const expiredToken = btoa(`user123:session:${oldTimestamp}`);

    const result = parseUnsubscribeToken(expiredToken);
    expect(result).toBeNull();
  });

  it("should accept recent tokens", () => {
    // Create a token with a recent timestamp
    const recentTimestamp = Date.now() - 1 * 24 * 60 * 60 * 1000; // 1 day ago
    const recentToken = btoa(`user123:session:${recentTimestamp}`);

    const result = parseUnsubscribeToken(recentToken);
    expect(result).toBeTruthy();
    expect(result?.userId).toBe("user123");
  });
});
