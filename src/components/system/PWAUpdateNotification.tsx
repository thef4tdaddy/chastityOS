/**
 * PWA Update Notification
 * Shows a notification when a PWA update is available
 */
import React, { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { FaSync, FaTimes } from "@/utils/iconImport";
import { Button } from "@/components/ui";

export const PWAUpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // Service worker registered successfully
    },
    onRegisterError() {
      // Service worker registration failed
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowUpdate(true);
    }
  }, [needRefresh]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
      // App will reload automatically after update
    } catch {
      // Error updating service worker
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-2xl z-50 border border-blue-500/50">
      <Button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
        aria-label="Dismiss update notification"
      >
        <FaTimes />
      </Button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 mt-1">
          <FaSync
            className={`text-2xl text-blue-200 ${isUpdating ? "animate-spin" : ""}`}
          />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Update Available</h3>
          <p className="text-sm text-blue-100 mb-4">
            A new version of ChastityOS is ready to install. Update now to get
            the latest features and improvements.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleDismiss}
              disabled={isUpdating}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Later
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Updating..." : "Update Now"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
