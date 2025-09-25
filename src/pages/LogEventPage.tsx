import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import { eventDBService } from "../services/database";
import type { DBEvent, EventType } from "../types/database";
import { LogEventForm, EventList } from "../components/log_event";
import { logger } from "../utils/logging";
import { FaSpinner } from "../utils/iconImport";

const LogEventPage: React.FC = () => {
  const { user } = useAuthState();
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userEvents = await eventDBService.findByUserId(user.uid);
        // Sort by timestamp descending (newest first)
        userEvents.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
        setEvents(userEvents);
      } catch (error) {
        logger.error("Error fetching events:", error, "LogEventPage");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const handleEventLogged = (
    newEvent: Omit<DBEvent, "id" | "lastModified" | "syncStatus">,
  ) => {
    // Add the new event to the top of the list
    const eventWithDefaults: DBEvent = {
      ...newEvent,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastModified: new Date(),
      syncStatus: "pending",
    };
    setEvents((prev) => [eventWithDefaults, ...prev]);
  };

  return (
    <div className="text-nightly-spring-green">
      {/* Content */}
      <div className="p-4 max-w-4xl">
        <LogEventForm onEventLogged={handleEventLogged} />

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-nighty-honeydew mb-6">
            Recent Events
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
              <div className="text-nightly-celadon">Loading events...</div>
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
