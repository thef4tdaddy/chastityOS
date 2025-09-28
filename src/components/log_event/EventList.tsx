import React from "react";
import type { DBEvent, EventType } from "../../types/database";
import {
  FaCalendar,
  FaHeart,
  FaFire,
  FaGamepad,
  FaTint,
} from "../../utils/iconImport";

// Event type definitions with modern icons
const EVENT_TYPES = [
  {
    value: "orgasm" as EventType,
    label: "Orgasm",
    icon: FaHeart,
    color: "text-red-400",
    description: "Self or partner induced orgasm",
  },
  {
    value: "sexual_activity" as EventType,
    label: "Sexual Activity",
    icon: FaFire,
    color: "text-orange-400",
    description: "Sexual play or activity",
  },
  {
    value: "milestone" as EventType,
    label: "Milestone",
    icon: FaGamepad,
    color: "text-nightly-aquamarine",
    description: "Achievement or milestone reached",
  },
  {
    value: "note" as EventType,
    label: "Note",
    icon: FaTint,
    color: "text-nightly-lavender-floral",
    description: "General note or observation",
  },
];

// Event List Component
interface EventListProps {
  events: DBEvent[];
}

export const EventList: React.FC<EventListProps> = ({ events }) => {
  const getEventTypeInfo = (type: EventType) => {
    return EVENT_TYPES.find((et) => et.value === type) || EVENT_TYPES[3]!; // Default to note
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="text-center py-8">
          <FaCalendar className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
          <div className="text-nightly-celadon">No events logged yet</div>
          <div className="text-sm text-nightly-celadon/70">
            Log your first event above
          </div>
        </div>
      ) : (
        events.map((event) => {
          const eventTypeInfo = getEventTypeInfo(event.type);
          const Icon = eventTypeInfo.icon;

          return (
            <div
              key={event.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className={eventTypeInfo.color} />
                  <div>
                    <h3 className="font-medium text-nighty-honeydew">
                      {eventTypeInfo.label}
                    </h3>
                    <div className="text-xs text-nightly-celadon">
                      {formatDate(event.timestamp)}
                    </div>
                  </div>
                </div>
                {event.isPrivate && (
                  <span className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded">
                    Private
                  </span>
                )}
              </div>

              {/* Content */}
              {event.details.notes && (
                <p className="text-nighty-honeydew mb-3">
                  {event.details.notes}
                </p>
              )}

              {/* Details */}
              <div className="flex gap-4 text-xs text-nightly-celadon">
                {event.details.mood && <span>Mood: {event.details.mood}</span>}
                {event.details.intensity && (
                  <span>Intensity: {event.details.intensity}/10</span>
                )}
              </div>

              {/* Tags */}
              {event.details.tags && event.details.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {event.details.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-2 py-1 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
