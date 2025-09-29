import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import { useKeyholderStore } from "../stores/keyholderStore";
import { sessionDBService } from "../services/database";
import type { DBSession } from "../types/database";
import {
  KeyholderPasswordUnlock,
  AccountLinkingPreview,
  AdminDashboard,
  SessionControls,
  TaskManagement,
} from "../components/keyholder";
import { logger } from "../utils/logging";
import { FaLock, FaCog, FaEye, FaSpinner } from "../utils/iconImport";

// Loading Component
const LoadingDisplay: React.FC = () => (
  <div className="text-center py-8">
    <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
    <div className="text-nightly-celadon">Loading keyholder controls...</div>
  </div>
);

// Settings Component
const KeyholderSettings: React.FC<{ onLockControls: () => void }> = ({
  onLockControls,
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
    <div className="flex items-center gap-3 mb-4">
      <FaCog className="text-nightly-spring-green" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Keyholder Settings
      </h3>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button className="bg-white/5 hover:bg-white/10 p-4 rounded-lg text-left transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <FaEye className="text-nightly-aquamarine" />
          <span className="font-medium text-nightly-honeydew">
            View Full Report
          </span>
        </div>
        <p className="text-sm text-nightly-celadon">
          See complete session history and statistics
        </p>
      </button>

      <button className="bg-white/5 hover:bg-white/10 p-4 rounded-lg text-left transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <FaCog className="text-nightly-lavender-floral" />
          <span className="font-medium text-nightly-honeydew">
            Manage Rules
          </span>
        </div>
        <p className="text-sm text-nightly-celadon">
          Set requirements and restrictions
        </p>
      </button>
    </div>

    <button
      onClick={onLockControls}
      className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
    >
      <FaLock />
      Lock Controls
    </button>
  </div>
);

// Custom hook for data fetching
const useKeyholderData = (user: any) => {
  const [currentSession, setCurrentSession] = useState<DBSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [session] = await Promise.all([
          sessionDBService.getCurrentSession(user.uid),
        ]);

        setCurrentSession(session || null);
      } catch (error) {
        logger.error("Error fetching keyholder data:", error, "KeyholderPage");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { currentSession, loading };
};

const KeyholderPage: React.FC = () => {
  const { user } = useAuthState();
  // Selective subscriptions for specific keyholder store values
  const isKeyholderModeUnlocked = useKeyholderStore(
    (state) => state.isKeyholderModeUnlocked,
  );
  const lockKeyholderControls = useKeyholderStore(
    (state) => state.lockKeyholderControls,
  );

  const { currentSession, loading } = useKeyholderData(user);

  // Auto-lock when leaving page
  useEffect(() => {
    return () => {
      if (isKeyholderModeUnlocked) {
        lockKeyholderControls();
      }
    };
  }, [isKeyholderModeUnlocked, lockKeyholderControls]);

  return (
    <div className="text-nightly-spring-green">
      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {loading ? (
          <LoadingDisplay />
        ) : (
          <div className="space-y-6">
            {/* Account Linking - Always visible */}
            <AccountLinkingPreview />

            {/* Admin Dashboard - Always visible for keyholders */}
            <AdminDashboard />

            {/* Current Password System */}
            <KeyholderPasswordUnlock />

            {/* Keyholder Controls - Only when unlocked */}
            {isKeyholderModeUnlocked && (
              <>
                <SessionControls session={currentSession} />
                <TaskManagement userId={user?.uid || ""} />
                <KeyholderSettings onLockControls={lockKeyholderControls} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyholderPage;
