/**
 * Tests for PeriodicSyncService
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PeriodicSyncService } from "../PeriodicSyncService";

describe("PeriodicSyncService", () => {
  let service: PeriodicSyncService;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as unknown as Storage;

    service = PeriodicSyncService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getInstance", () => {
    it("should return a singleton instance", () => {
      const instance1 = PeriodicSyncService.getInstance();
      const instance2 = PeriodicSyncService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("isSupported", () => {
    it("should return false when serviceWorker is not available", () => {
      // @ts-expect-error - Mocking navigator
      global.navigator = {} as Navigator;
      expect(service.isSupported()).toBe(false);
    });

    it("should return false when periodicSync is not available", () => {
      // Mock ServiceWorkerRegistration without periodicSync
      const mockServiceWorkerRegistration = function () {};
      Object.defineProperty(mockServiceWorkerRegistration, "prototype", {
        value: {},
      });
      global.ServiceWorkerRegistration = mockServiceWorkerRegistration as never;

      // @ts-expect-error - Mocking navigator
      global.navigator = {
        serviceWorker: {},
      } as Navigator;

      expect(service.isSupported()).toBe(false);
    });
  });

  describe("getSettings", () => {
    it("should return default settings when no settings are saved", () => {
      const settings = service.getSettings();
      expect(settings).toEqual({
        enabled: false,
        intervalMinutes: 15,
        batteryAware: true,
      });
    });

    it("should save settings to localStorage", async () => {
      // Mock isSupported to return false to avoid trying to register
      vi.spyOn(service, "isSupported").mockReturnValue(false);

      await service.updateSettings({
        enabled: true,
        intervalMinutes: 30,
        batteryAware: false,
      });

      const savedSettings = JSON.parse(
        localStorageMock["periodicSyncSettings"] || "{}",
      );

      expect(savedSettings.enabled).toBe(true);
      expect(savedSettings.intervalMinutes).toBe(30);
      expect(savedSettings.batteryAware).toBe(false);
    });
  });

  describe("updateSettings", () => {
    it("should update settings and save to localStorage", async () => {
      // Mock isSupported to return false to avoid trying to register
      vi.spyOn(service, "isSupported").mockReturnValue(false);

      const newSettings = {
        enabled: true,
        intervalMinutes: 20,
      };

      await service.updateSettings(newSettings);

      const savedSettings = JSON.parse(
        localStorageMock["periodicSyncSettings"] || "{}",
      );
      expect(savedSettings.enabled).toBe(true);
      expect(savedSettings.intervalMinutes).toBe(20);
    });
  });

  describe("getLastSyncTime", () => {
    it("should return undefined when no sync has occurred", () => {
      expect(service.getLastSyncTime()).toBeUndefined();
    });

    it("should return the last sync time after a sync", async () => {
      // Mock isSupported to return false to avoid trying to register
      vi.spyOn(service, "isSupported").mockReturnValue(false);

      const now = Date.now();
      await service.updateSettings({ lastSyncTime: now });
      expect(service.getLastSyncTime()).toBe(now);
    });
  });
});
