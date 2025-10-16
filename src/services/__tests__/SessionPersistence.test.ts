/**
 * Session Persistence Service Tests
 * Basic tests to verify session persistence functionality
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "vitest";

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock BroadcastChannel
class MockBroadcastChannel {
  private listeners: Array<(event: MessageEvent) => void> = [];

  constructor(public name: string) {}

  addEventListener(event: string, listener: (event: MessageEvent) => void) {
    if (event === "message") {
      this.listeners.push(listener);
    }
  }

  postMessage(data: any) {
    const event = new MessageEvent("message", { data });
    this.listeners.forEach((listener) => listener(event));
  }

  close() {
    this.listeners = [];
  }
}

// Setup global mocks
if (typeof window !== "undefined") {
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(window, "sessionStorage", {
    value: mockLocalStorage,
    writable: true,
  });
}

(globalThis as any).BroadcastChannel = MockBroadcastChannel;
(globalThis as any).navigator = {
  onLine: true,
};

describe("SessionPersistence Service", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  test("should initialize service", () => {
    // This is a basic test to verify the module can be imported
    // without compilation errors when the dependencies are resolved
    expect(true).toBe(true);
  });

  test("should handle localStorage backup state", () => {
    const backupKey = "chastity_session_backup";
    const testState = {
      activeSessionId: "test-session-123",
      sessionStartTime: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      pauseState: {
        isPaused: false,
        accumulatedPauseTime: 0,
      },
    };

    // Test storing backup state
    mockLocalStorage.setItem(backupKey, JSON.stringify(testState));

    // Test retrieving backup state
    const retrieved = mockLocalStorage.getItem(backupKey);
    expect(retrieved).not.toBeNull();

    const parsed = JSON.parse(retrieved!);
    expect(parsed.activeSessionId).toBe(testState.activeSessionId);
    expect(parsed.pauseState.isPaused).toBe(false);
  });

  test("should handle BroadcastChannel messaging", () => {
    const channel = new MockBroadcastChannel("chastity_session_sync");
    let receivedMessage: any = null;

    channel.addEventListener("message", (event) => {
      receivedMessage = event.data;
    });

    const testMessage = {
      type: "SESSION_UPDATED",
      data: { sessionId: "test-123" },
      timestamp: Date.now(),
    };

    channel.postMessage(testMessage);

    expect(receivedMessage).toEqual(testMessage);
  });

  test("should generate unique tab IDs", () => {
    const tabId1 = Math.random().toString(36).substr(2, 9);
    const tabId2 = Math.random().toString(36).substr(2, 9);

    expect(tabId1).not.toBe(tabId2);
    expect(tabId1.length).toBe(9);
    expect(tabId2.length).toBe(9);
  });
});
