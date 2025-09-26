/**
 * Offline Demo Hook
 * Utility for testing offline functionality
 */
import { useState, useEffect } from "react";

export const useOfflineDemo = () => {
  const [forceOffline, setForceOffline] = useState(false);
  const [actualOnlineStatus, setActualOnlineStatus] = useState(
    navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setActualOnlineStatus(true);
    const handleOffline = () => setActualOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const simulateOffline = () => {
    setForceOffline(true);
    // Dispatch a fake offline event for testing
    window.dispatchEvent(new Event("offline"));
  };

  const simulateOnline = () => {
    setForceOffline(false);
    // Only dispatch online if we're actually online
    if (actualOnlineStatus) {
      window.dispatchEvent(new Event("online"));
    }
  };

  return {
    isOnline: actualOnlineStatus && !forceOffline,
    actualOnlineStatus,
    forceOffline,
    simulateOffline,
    simulateOnline,
  };
};
