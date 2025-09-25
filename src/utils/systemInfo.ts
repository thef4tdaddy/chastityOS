// src/utils/systemInfo.ts

import type { SystemInfo } from "../types/feedback";

export async function collectSystemInfo(): Promise<SystemInfo> {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    indexedDB: !!window.indexedDB,
    serviceWorker: "serviceWorker" in navigator,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    referrer: document.referrer,
  };
}
