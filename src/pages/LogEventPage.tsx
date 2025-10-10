import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import { useEventHistory } from "../hooks/api/useEvents";
import { useAccountLinking } from "../hooks/account-linking/useAccountLinking";
import { LogEventForm, EventList } from "../components/log_event";
import { FaUsers } from "../utils/iconImport";
import { combineAndSortEvents } from "../utils/events/eventHelpers";
import { Card, LoadingState } from "@/components/ui";

// User selector component for keyholders
interface UserSelectorProps {
  activeSubmissive?: { wearerId?: string; wearerName?: string };
  selectedUserId: string;
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  activeSubmissive,
  selectedUserId,
  currentUserId,
  onSelectUser,
}) => {
  if (!activeSubmissive) return null;

  return (
    <Card variant="glass" padding="sm" className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FaUsers className="text-nightly-aquamarine" />
        <label className="text-sm font-medium text-nightly-celadon">
          Log event for:
        </label>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSelectUser(currentUserId)}
          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
            selectedUserId === currentUserId
              ? "border-nightly-aquamarine bg-nightly-aquamarine/10 text-nightly-honeydew"
              : "border-white/10 bg-white/5 text-nightly-celadon hover:bg-white/10"
          }`}
        >
          Yourself
        </button>
        <button
          onClick={() => onSelectUser(activeSubmissive.wearerId || "")}
          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
            selectedUserId === activeSubmissive.wearerId
              ? "border-nightly-lavender-floral bg-nightly-lavender-floral/10 text-nightly-honeydew"
              : "border-white/10 bg-white/5 text-nightly-celadon hover:bg-white/10"
          }`}
        >
          {activeSubmissive.wearerName || "Submissive"}
        </button>
      </div>
    </Card>
  );
};

// Event list section with loading and error states
interface EventListSectionProps {
  loading: boolean;
  error: Error | null;
  events: unknown[];
  showOwner: boolean;
  hasSubmissive: boolean;
}

const EventListSection: React.FC<EventListSectionProps> = ({
  loading,
  error,
  events,
  showOwner,
  hasSubmissive,
}) => (
  <Card variant="glass">
    <h2 className="text-xl font-semibold text-nightly-honeydew mb-6">
      {hasSubmissive ? "Combined Events" : "Recent Events"}
    </h2>

    {loading ? (
      <LoadingState message="Loading events..." size="lg" />
    ) : error ? (
      <div className="text-center py-8">
        <div className="text-red-400">
          Error loading events. Please try again.
        </div>
      </div>
    ) : (
      <EventList events={events} showOwner={showOwner} />
    )}
  </Card>
);

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
  const combinedEvents = React.useMemo(
    () =>
      combineAndSortEvents(userEvents.data || [], submissiveEvents.data || [], {
        userName: user?.displayName || "You",
        userId: user?.uid,
        submissiveName: activeSubmissive?.wearerName || "Submissive",
        submissiveId: activeSubmissive?.wearerId,
      }),
    [userEvents.data, submissiveEvents.data, user, activeSubmissive],
  );

  const loading = userEvents.isLoading || submissiveEvents.isLoading;
  const error = userEvents.error || submissiveEvents.error;

  const handleEventLogged = () => {
    // Event creation now handled by LogEventForm using useCreateEvent hook
    // No need for manual state updates - TanStack Query will handle cache updates
  };

  return (
    <div className="text-nightly-spring-green">
      <div className="p-4 max-w-4xl mx-auto">
        <UserSelector
          activeSubmissive={activeSubmissive}
          selectedUserId={selectedUserId}
          currentUserId={user?.uid || ""}
          onSelectUser={setSelectedUserId}
        />

        <LogEventForm
          onEventLogged={handleEventLogged}
          targetUserId={selectedUserId}
        />

        <EventListSection
          loading={loading}
          error={error}
          events={activeSubmissive ? combinedEvents : userEvents.data || []}
          showOwner={!!activeSubmissive}
          hasSubmissive={!!activeSubmissive}
        />
      </div>
    </div>
  );
};

export default LogEventPage;
