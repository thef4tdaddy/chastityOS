import React from "react";
import { useAuthState } from "../contexts";
import { useEventHistory } from "../hooks/api/useEvents";
import { LogEventForm, EventList } from "../components/log_event";
import { FaSpinner } from "../utils/iconImport";

const LogEventPage: React.FC = () => {
  const { user } = useAuthState();

  // Use TanStack Query hook for event history
  const {
    data: events = [],
    isLoading: loading,
    error,
  } = useEventHistory(user?.uid || "", { limit: 50 });

  const handleEventLogged = () => {
    // Event creation now handled by LogEventForm using useCreateEvent hook
    // No need for manual state updates - TanStack Query will handle cache updates
  };

  return (
    <div className="text-nightly-spring-green">
      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        <LogEventForm onEventLogged={handleEventLogged} />

        <div className="glass-card">
          <h2 className="text-xl font-semibold text-nightly-honeydew mb-6">
            Recent Events
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
            <EventList events={events} />
          )}
        </div>
      </div>
    </div>
  );
};

export default LogEventPage;
