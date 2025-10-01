/**
 * Test Setup Configuration
 * Global setup for Vitest test environment
 */
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Extend Vitest's expect with testing library matchers
// @ts-expect-error - vitest globals
global.expect = expect;

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Firebase to prevent actual network calls during tests
vi.mock("./services/firebase", () => ({
  getFirestore: vi.fn(() => ({})),
  getAuth: vi.fn(() => ({})),
  initializeApp: vi.fn(() => ({})),
}));

// Mock console methods for clean test output
globalThis.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as any;

// Mock window.matchMedia for responsive component tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for UI component tests
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock ResizeObserver for responsive component tests
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
});

// Mock IndexedDB for Dexie tests
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
};

Object.defineProperty(window, "indexedDB", {
  value: indexedDBMock,
});

// Mock crypto.randomUUID for ID generation
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: vi.fn(
      () => "mock-uuid-" + Math.random().toString(36).substr(2, 9),
    ),
  },
});
