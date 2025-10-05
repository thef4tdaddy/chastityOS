import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import { useEventHistory } from "../hooks/api/useEvents";
import { useAccountLinking } from "../hooks/account-linking/useAccountLinking";
import { LogEventForm, EventList } from "../components/log_event";
import { FaSpinner, FaUsers } from "../utils/iconImport";

const LogEventPage: React.FC = () => {
  const { user } = useAuthState();
  const { adminRelationships } = useAccountLinking();

  // Track which user we're logging for (self or submissive)
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.uid || "");

  // Update selectedUserId when user changes
  useEffect(() => {
    if (user?.uid) {
      setSelectedUserId(user.uid);
    }
  }, [user?.uid]);

  // Get the active submissive relationship (first one for now)
  const activeSubmissive = adminRelationships?.[0];

  // Fetch events for both users if keyholder has submissive
  const userEvents = useEventHistory(user?.uid || "", { limit: 50 });
  const submissiveEvents = useEventHistory(activeSubmissive?.wearerId || "", {
    limit: 50,
  });

  // Combine and sort events by timestamp
  const combinedEvents = React.useMemo(() => {
    const allEvents = [
      ...(userEvents.data || []).map((e) => ({
        ...e,
        ownerName: user?.displayName || "You",
        ownerId: user?.uid,
      })),
      ...(submissiveEvents.data || []).map((e) => ({
        ...e,
        ownerName: activeSubmissive?.wearerName || "Submissive",
        ownerId: activeSubmissive?.wearerId,
      })),
    ];

    return allEvents.sort((a, b) => {
      const timeA =
        a.timestamp instanceof Date ? a.timestamp.getTime() : a.timestamp;
      const timeB =
        b.timestamp instanceof Date ? b.timestamp.getTime() : b.timestamp;
      return timeB - timeA; // Most recent first
    });
  }, [userEvents.data, submissiveEvents.data, user, activeSubmissive]);

  const loading = userEvents.isLoading || submissiveEvents.isLoading;
  const error = userEvents.error || submissiveEvents.error;

  const handleEventLogged = () => {
    // Event creation now handled by LogEventForm using useCreateEvent hook
    // No need for manual state updates - TanStack Query will handle cache updates
  };

  return (
    <div className="text-nightly-spring-green">
      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* User selector for keyholders */}
        {activeSubmissive && (
          <div className="glass-card mb-6 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaUsers className="text-nightly-aquamarine" />
              <label className="text-sm font-medium text-nightly-celadon">
                Log event for:
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUserId(user?.uid || "")}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedUserId === user?.uid
                    ? "border-nightly-aquamarine bg-nightly-aquamarine/10 text-nightly-honeydew"
                    : "border-white/10 bg-white/5 text-nightly-celadon hover:bg-white/10"
                }`}
              >
                Yourself
              </button>
              <button
                onClick={() =>
                  setSelectedUserId(activeSubmissive.wearerId || "")
                }
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedUserId === activeSubmissive.wearerId
                    ? "border-nightly-lavender-floral bg-nightly-lavender-floral/10 text-nightly-honeydew"
                    : "border-white/10 bg-white/5 text-nightly-celadon hover:bg-white/10"
                }`}
              >
                {activeSubmissive.wearerName || "Submissive"}
              </button>
            </div>
          </div>
        )}

        <LogEventForm
          onEventLogged={handleEventLogged}
          targetUserId={selectedUserId}
        />

        <div className="glass-card">
          <h2 className="text-xl font-semibold text-nightly-honeydew mb-6">
            {activeSubmissive ? "Combined Events" : "Recent Events"}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
              <div className="text-nightly-celadon">Loading events...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400">
                Error loading events. Please try again.
              </div>
            </div>
          ) : (
            <EventList
              events={activeSubmissive ? combinedEvents : userEvents.data || []}
              showOwner={!!activeSubmissive}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LogEventPage;
