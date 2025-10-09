import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import { useKeyholderStore } from "../stores/keyholderStore";
import { useAccountLinking } from "../hooks/account-linking/useAccountLinking";
import { sessionDBService } from "../services/database";
import type { DBSession } from "../types/database";
import type { AdminRelationship } from "../types/account-linking";
import {
  KeyholderPasswordUnlock,
  AccountLinkingPreview,
  KeyholderDashboard,
  SessionControls,
  TaskManagement,
} from "../components/keyholder";
import { KeyholderDurationSection } from "../components/settings/KeyholderDurationSection";
import { logger } from "../utils/logging";
import { FaLock, FaCog, FaEye, FaSpinner } from "../utils/iconImport";
import {
  FeatureErrorBoundary,
  KeyholderErrorFallback,
} from "../components/errors";

// Loading Component
const LoadingDisplay: React.FC = () => (
  <div className="text-center py-8">
    <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
    <div className="text-nightly-celadon">Loading keyholder controls...</div>
  </div>
);

// Settings Component
const KeyholderSettings: React.FC<{
  onLockControls: () => void;
  submissiveUserId?: string;
}> = ({ onLockControls, submissiveUserId }) => (
  <div className="space-y-6">
    {/* Keyholder Duration Goal */}
    {submissiveUserId && <KeyholderDurationSection userId={submissiveUserId} />}

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
  </div>
);

// Custom hook for fetching submissive's data
const useSubmissiveData = (
  selectedRelationship: AdminRelationship | null | undefined,
) => {
  const [submissiveSession, setSubmissiveSession] = useState<DBSession | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedRelationship) {
        setSubmissiveSession(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch submissive's (wearer's) session
        const session = await sessionDBService.getCurrentSession(
          selectedRelationship.wearerId,
        );

        setSubmissiveSession(session || null);
      } catch (error) {
        logger.error("Error fetching submissive data:", error, "KeyholderPage");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedRelationship]);

  return { submissiveSession, loading };
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

  // Get keyholder relationships and selected wearer
  const { relationships, keyholderRelationships, selectedWearerId } =
    useAccountLinking();

  // Get selected relationship
  const selectedRelationship = selectedWearerId
    ? relationships.find((r) => r.wearerId === selectedWearerId)
    : keyholderRelationships[0];

  const { submissiveSession, loading } =
    useSubmissiveData(selectedRelationship);

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

            {/* Keyholder Dashboard - Always visible for keyholders */}
            <FeatureErrorBoundary
              feature="keyholder-dashboard"
              fallback={<KeyholderErrorFallback />}
            >
              <KeyholderDashboard keyholderUserId={user?.uid} />
            </FeatureErrorBoundary>

            {/* Current Password System */}
            <KeyholderPasswordUnlock />

            {/* Keyholder Controls - Only when unlocked */}
            {isKeyholderModeUnlocked && (
              <FeatureErrorBoundary
                feature="keyholder-controls"
                fallback={<KeyholderErrorFallback />}
              >
                <SessionControls session={submissiveSession} />
                <TaskManagement
                  userId={selectedRelationship?.wearerId || user?.uid || ""}
                />
                <KeyholderSettings
                  onLockControls={lockKeyholderControls}
                  submissiveUserId={selectedRelationship?.wearerId}
                />
              </FeatureErrorBoundary>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyholderPage;
