import React, { useState, useEffect } from "react";
import { FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import { useSessionPersistence } from "../../hooks/useSessionPersistence";
import { logger } from "../../utils/logging";

// Define local interface to avoid restricted import
interface SessionRestorationResult {
  success: boolean;
  error?: string;
  wasRestored: boolean;
  [key: string]: unknown;
}

interface SessionLoaderProps {
  userId: string;
  onSessionRestored: (result: SessionRestorationResult) => void;
  onInitialized: () => void;
}

export const SessionLoader: React.FC<SessionLoaderProps> = ({
  userId,
  onSessionRestored,
  onInitialized,
}) => {
  const [progress, setProgress] = useState(0);
  const { initializeSession, isInitializing, error } = useSessionPersistence();

  useEffect(() => {
    const initializeSessionState = async () => {
      if (!userId) return;

      try {
        setProgress(25);

        // Initialize session state using the hook
        const result = await initializeSession(userId);
        setProgress(75);

        if (result.wasRestored) {
          onSessionRestored(result);
        }

        setProgress(100);
        onInitialized();
      } catch (error) {
        // Error is already handled by the hook
        logger.error(
          "Session initialization failed",
          { error },
          "SessionLoader",
        );
      }
    };

    initializeSessionState();
  }, [userId, initializeSession, onSessionRestored, onInitialized]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <FaExclamationTriangle className="text-red-400 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Session Restoration Failed
          </h3>
          <p className="text-sm text-red-200 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            Loading Session...
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Restoring your chastity session
          </p>
          <div className="w-64 bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{progress}%</p>
        </div>
      </div>
    );
  }

  return null;
};
