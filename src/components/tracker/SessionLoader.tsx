import React, { useEffect } from "react";
import { FaExclamationTriangle } from "../../utils/iconImport";
import { useSessionLoader } from "../../hooks/session/useSessionLoader";
import { LoadingState, Button } from "@/components/ui";

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
  const { loadSession, isLoading, error, progress, session } =
    useSessionLoader();

  useEffect(() => {
    const initializeSessionState = async () => {
      if (!userId) return;

      await loadSession(userId);
      onInitialized();
    };

    initializeSessionState();
    // loadSession is from useSessionLoader hook (useCallback), not a Zustand store action
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [userId, loadSession, onInitialized]);

  // Separate effect to handle session restoration callback
  useEffect(() => {
    if (session) {
      onSessionRestored({
        success: true,
        wasRestored: true,
      });
    }
  }, [session, onSessionRestored]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <FaExclamationTriangle className="text-red-400 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Session Restoration Failed
          </h3>
          <p className="text-sm text-red-200 mb-4">
            {error?.message || "Unknown error"}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Reload App
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <LoadingState message="Loading Session..." fullScreen>
        {progress > 0 && (
          <>
            <div className="w-64 bg-gray-700 rounded-full h-2 mt-4 mx-auto">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{progress}%</p>
          </>
        )}
      </LoadingState>
    );
  }

  return null;
};
