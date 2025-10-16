/**
 * Test Utilities
 * Helper functions and utilities for testing
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { vi, expect } from "vitest";

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  id: "test-user-123",
  email: "test@example.com",
  isAnonymous: false,
  createdAt: new Date(),
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  id: "test-session-123",
  userId: "test-user-123",
  startTime: new Date(),
  endTime: null,
  isPaused: false,
  accumulatedPauseTime: 0,
  goalDuration: 3600, // 1 hour
  isHardcoreMode: false,
  keyholderApprovalRequired: false,
  syncStatus: "pending" as const,
  lastModified: new Date(),
  ...overrides,
});

export const createMockEvent = (overrides = {}) => ({
  id: "test-event-123",
  userId: "test-user-123",
  type: "orgasm" as const,
  timestamp: new Date(),
  details: {
    intensity: 5,
    notes: "Test event",
  },
  isPrivate: false,
  syncStatus: "pending" as const,
  lastModified: new Date(),
  ...overrides,
});

export const createMockTask = (overrides = {}) => ({
  id: "test-task-123",
  userId: "test-user-123",
  text: "Test task",
  description: "A test task description",
  status: "pending" as const,
  priority: "medium" as const,
  assignedBy: "keyholder" as const,
  createdAt: new Date(),
  dueDate: new Date(Date.now() + 86400000), // 1 day from now
  syncStatus: "pending" as const,
  lastModified: new Date(),
  ...overrides,
});

export const createMockSettings = (overrides = {}) => ({
  userId: "test-user-123",
  theme: "dark" as const,
  notifications: {
    enabled: true,
    sessionReminders: true,
    taskDeadlines: true,
    keyholderMessages: true,
    goalProgress: true,
  },
  chastity: {
    allowEmergencyUnlock: true,
    requireKeyholderApproval: false,
    pauseCooldownHours: 4,
    maxDailyPauses: 3,
  },
  privacy: {
    allowDataCollection: true,
    shareAnonymousStats: false,
  },
  ...overrides,
});

// Firebase mock helpers
export const createMockFirebaseDoc = (data: Record<string, unknown>) => ({
  id: "test-doc-id",
  data: () => data,
  exists: () => true,
  ref: {
    id: "test-doc-id",
    path: "test/path",
  },
});

export const createMockFirebaseCollection = (
  docs: Record<string, unknown>[],
) => ({
  docs: docs.map(createMockFirebaseDoc),
  size: docs.length,
  empty: docs.length === 0,
  forEach: (callback: (doc: Record<string, unknown>) => void) =>
    docs.forEach((doc) => callback(createMockFirebaseDoc(doc))),
});

// Time manipulation helpers
export const advanceTime = (milliseconds: number) => {
  vi.advanceTimersByTime(milliseconds);
};

export const setSystemTime = (date: Date) => {
  vi.setSystemTime(date);
};

// DOM testing helpers
export const waitForLoadingToFinish = async () => {
  // Wait for any loading states to complete
  await new Promise((resolve) => setTimeout(resolve, 0));
};

// Store testing helpers
export const resetAllStores = () => {
  // This would be used to reset all Zustand stores between tests
  // Implementation depends on the specific stores
};

// Async testing helpers
export const waitForAsync = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const flushPromises = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Error boundary testing
export const createErrorBoundaryWrapper = () => {
  const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    try {
      return React.createElement(React.Fragment, null, children);
    } catch (error) {
      return React.createElement(
        "div",
        { "data-testid": "error-boundary" },
        `Error: ${String(error)}`,
      );
    }
  };
  return ErrorBoundary;
};

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions,
) => {
  // This would wrap components with necessary providers
  // For now, using basic render
  return render(ui, options);
};

// Validation helpers
export const expectToBeDate = (value: unknown) => {
  expect(value).toBeInstanceOf(Date);
  expect((value as Date).getTime()).not.toBeNaN();
};

export const expectToBeValidId = (value: unknown) => {
  expect(typeof value).toBe("string");
  expect((value as string).length).toBeGreaterThan(0);
};

// Performance testing helpers
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Snapshot testing helpers
export const createStableSnapshot = (obj: Record<string, unknown>) => {
  // Remove timestamps and volatile data for stable snapshots
  const stable = JSON.parse(JSON.stringify(obj));
  if (stable.timestamp) stable.timestamp = "[timestamp]";
  if (stable.createdAt) stable.createdAt = "[createdAt]";
  if (stable.lastModified) stable.lastModified = "[lastModified]";
  if (stable.id && stable.id.includes("test-")) stable.id = "[test-id]";
  return stable;
};
