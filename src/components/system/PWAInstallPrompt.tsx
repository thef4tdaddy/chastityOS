/**
 * PWA Install Prompt
 * Shows a custom prompt to install the app as a PWA
 */
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { pwaInstallManager } from "@/services/pwa";
import { FaTimes, FaDownload } from "@/utils/iconImport";

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Subscribe to install availability changes
    const unsubscribe = pwaInstallManager.onInstallAvailable((canInstall) => {
      setShowPrompt(canInstall);
    });

    // Subscribe to app installed events
    const unsubscribeInstalled = pwaInstallManager.onAppInstalled(() => {
      setShowPrompt(false);
      setIsInstalling(false);
    });

    return () => {
      unsubscribe();
      unsubscribeInstalled();
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await pwaInstallManager.promptInstall();

    if (success) {
      setShowPrompt(false);
    }
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 rounded-lg shadow-2xl z-50 border border-purple-500/50">
      <Button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
        aria-label="Dismiss install prompt"
      >
        <FaTimes />
      </Button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 mt-1">
          <FaDownload className="text-2xl text-purple-200" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Install ChastityOS</h3>
          <p className="text-sm text-purple-100 mb-4">
            Add to your home screen for a better experience with offline
            support, faster loading, and native app feel.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={handleDismiss}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Later
            </Button>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-4 py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInstalling ? "Installing..." : "Install App"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
