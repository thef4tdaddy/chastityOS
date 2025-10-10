/**
 * Vitest Test Setup
 * Global test configuration and mocks
 */

import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn(),
    writeBatch: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
  },
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInAnonymously: vi.fn(),
  },
  storage: {
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
  },
}));

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_FIREBASE_API_KEY: "test-api-key",
    VITE_FIREBASE_AUTH_DOMAIN: "test-auth-domain",
    VITE_FIREBASE_PROJECT_ID: "test-project-id",
    VITE_FIREBASE_STORAGE_BUCKET: "test-storage-bucket",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "test-sender-id",
    VITE_FIREBASE_APP_ID: "test-app-id",
  },
});

// Mock window.matchMedia
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

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof IntersectionObserver;

// Mock crypto for hash functions
Object.defineProperty(globalThis, "crypto", {
  value: {
    subtle: {
      digest: vi
        .fn()
        .mockImplementation(async (algorithm: string, data: ArrayBuffer) => {
          // Create a deterministic hash based on input data for testing
          const input = new Uint8Array(data);
          const hash = new ArrayBuffer(32);
          const view = new Uint8Array(hash);

          // Simple deterministic hash: sum all input bytes and use as seed
          let seed = 0;
          for (let i = 0; i < input.length; i++) {
            const byte = input[i];
            if (byte !== undefined) {
              seed += byte;
            }
          }

          // Fill hash buffer with deterministic pattern based on seed
          for (let i = 0; i < 32; i++) {
            view[i] = (seed + i * 7) % 256;
          }
          return hash;
        }),
    },
    randomUUID: vi.fn().mockImplementation(() => {
      // Generate a mock UUID v4
      const chars = "0123456789abcdef";
      const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        (c) => {
          const r = Math.floor(Math.random() * 16);
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return chars[v];
        },
      );
      return uuid;
    }),
  },
});

// Mock TextEncoder/TextDecoder
globalThis.TextEncoder = class TextEncoder {
  encode(input: string) {
    return new Uint8Array(input.split("").map((char) => char.charCodeAt(0)));
  }
} as unknown as typeof TextEncoder;

globalThis.TextDecoder = class TextDecoder {
  decode(input: Uint8Array) {
    return String.fromCharCode(...Array.from(input));
  }
} as unknown as typeof TextDecoder;

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock service worker
Object.defineProperty(navigator, "serviceWorker", {
  value: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  },
});

// Global test utilities
globalThis.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
