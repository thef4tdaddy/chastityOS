import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import { useEventHistory } from "../hooks/api/useEvents";
import { useAccountLinking } from "../hooks/account-linking/useAccountLinking";
import {
  LogEventForm,
  EventList,
  EventListSkeleton,
  EventErrorBoundary,
} from "../components/log_event";
import { FaUsers } from "../utils/iconImport";
import { combineAndSortEvents } from "../utils/events/eventHelpers";
import { Card, Tooltip, Button } from "@/components/ui";
import type { DBEvent } from "../types/database";

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
    <Card variant="glass" padding="sm" className="mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FaUsers className="text-nightly-aquamarine text-base sm:text-lg" />
        <label className="text-xs sm:text-sm font-medium text-nightly-celadon">
          Log event for:
        </label>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Tooltip content="Log a sexual event for yourself">
          <Button
            onClick={() => onSelectUser(currentUserId)}
            className={`flex-1 px-3 sm:px-4 py-3 sm:py-2 rounded-lg border-2 transition-all min-h-[44px] text-sm sm:text-base ${
              selectedUserId === currentUserId
                ? "border-nightly-aquamarine bg-nightly-aquamarine/10 text-nightly-honeydew"
                : "border-white/10 bg-white/5 text-nightly-celadon hover:bg-white/10"
            }`}
          >
            Yourself
          </Button>
        </Tooltip>
        <Tooltip
          content={`Log a sexual event for ${activeSubmissive.wearerName || "your submissive"}`}
        >
          <Button
            onClick={() => onSelectUser(activeSubmissive.wearerId || "")}
            className={`flex-1 px-3 sm:px-4 py-3 sm:py-2 rounded-lg border-2 transition-all min-h-[44px] text-sm sm:text-base ${
              selectedUserId === activeSubmissive.wearerId
                ? "border-nightly-lavender-floral bg-nightly-lavender-floral/10 text-nightly-honeydew"
                : "border-white/10 bg-white/5 text-nightly-celadon hover:bg-white/10"
            }`}
          >
            {activeSubmissive.wearerName || "Submissive"}
          </Button>
        </Tooltip>
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
  <Card variant="glass" className="p-3 sm:p-4 md:p-6">
    <h2 className="text-lg sm:text-xl font-semibold text-nightly-honeydew mb-4 sm:mb-6">
      {hasSubmissive ? "Combined Events" : "Recent Events"}
    </h2>

    {loading ? (
      <EventListSkeleton count={5} />
    ) : error ? (
      <div className="text-center py-6 sm:py-8 animate-fade-in">
        <div className="bg-red-950/30 border-2 border-red-400/20 rounded-lg p-4 sm:p-6">
          <div className="text-red-400 text-base sm:text-lg font-semibold mb-2">
            Failed to Load Events
          </div>
          <div className="text-red-300/70 text-sm sm:text-base mb-4">
            {error instanceof Error
              ? error.message
              : "Unable to load event history. Please check your connection and try again."}
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Reload Page
          </Button>
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
        submissiveName:
          (activeSubmissive as { wearerName?: string })?.wearerName ||
          "Submissive",
        submissiveId: activeSubmissive?.wearerId,
      }) as unknown as Array<
        DBEvent & { ownerName?: string; ownerId?: string }
      >,
    [userEvents.data, submissiveEvents.data, user, activeSubmissive],
  );

  const loading = userEvents.isLoading || submissiveEvents.isLoading;
  const error = userEvents.error || submissiveEvents.error;

  const handleEventLogged = () => {
    // Event creation now handled by LogEventForm using useCreateEvent hook
    // No need for manual state updates - TanStack Query will handle cache updates
  };

  return (
    <EventErrorBoundary>
      <div className="text-nightly-spring-green">
        <div className="p-2 sm:p-4 md:p-6 max-w-4xl mx-auto">
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
    </EventErrorBoundary>
  );
};

export default LogEventPage;
