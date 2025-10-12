import React, { memo, useMemo } from "react";
import type { DBEvent, EventType } from "../../types/database";
import {
  FaCalendar,
  FaHeart,
  FaFire,
  FaGamepad,
  FaTint,
} from "../../utils/iconImport";
import { Button } from "@/components/ui";

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

// Helper functions
const getEventTypeInfo = (type: EventType) => {
  return EVENT_TYPES.find((et) => et.value === type) || EVENT_TYPES[3]!; // Default to note
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

// Event Item Component
interface EventItemProps {
  event: DBEvent & { ownerName?: string; ownerId?: string };
  showOwner?: boolean;
}

const EventItemComponent: React.FC<EventItemProps> = ({ event, showOwner }) => {
  const eventTypeInfo = useMemo(
    () => getEventTypeInfo(event.type),
    [event.type],
  );
  const Icon = eventTypeInfo.icon;
  const formattedDate = useMemo(
    () => formatDate(event.timestamp),
    [event.timestamp],
  );

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Icon
            className={`${eventTypeInfo.color} text-lg sm:text-xl flex-shrink-0`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-nighty-honeydew text-sm sm:text-base">
                {eventTypeInfo.label}
              </h3>
              {showOwner && event.ownerName && (
                <span className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-2 py-0.5 text-xs rounded whitespace-nowrap">
                  {event.ownerName}
                </span>
              )}
            </div>
            <div className="text-xs text-nightly-celadon break-words">
              {formattedDate}
            </div>
          </div>
        </div>
        {event.isPrivate && (
          <span className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded whitespace-nowrap self-start">
            Private
          </span>
        )}
      </div>

      {/* Content */}
      {event.details.notes && (
        <p className="text-nighty-honeydew mb-3 text-sm sm:text-base break-words">
          {event.details.notes}
        </p>
      )}

      {/* Details */}
      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-nightly-celadon">
        {event.details.mood && (
          <span className="whitespace-nowrap">Mood: {event.details.mood}</span>
        )}
        {event.details.intensity && (
          <span className="whitespace-nowrap">
            Intensity: {event.details.intensity}/10
          </span>
        )}
      </div>

      {/* Tags */}
      {event.details.tags && event.details.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
          {event.details.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-2 py-1 text-xs rounded whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Memoize EventItem to prevent unnecessary re-renders
const EventItem = memo(EventItemComponent);

// Event List Component with pagination support
interface EventListProps {
  events: (DBEvent & { ownerName?: string; ownerId?: string })[];
  showOwner?: boolean;
  pageSize?: number;
}

const EventListComponent: React.FC<EventListProps> = ({
  events,
  showOwner = false,
  pageSize = 20,
}) => {
  const [currentPage, setCurrentPage] = React.useState(0);

  // Memoize paginated events to prevent recalculation
  const paginatedEvents = React.useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    return events.slice(startIndex, endIndex);
  }, [events, currentPage, pageSize]);

  const totalPages = Math.ceil(events.length / pageSize);
  const hasMorePages = currentPage < totalPages - 1;
  const hasPreviousPages = currentPage > 0;

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6 sm:py-8">
          <FaCalendar className="text-3xl sm:text-4xl text-nightly-celadon/50 mb-3 sm:mb-4 mx-auto" />
          <div className="text-nightly-celadon text-sm sm:text-base">
            No events logged yet
          </div>
          <div className="text-xs sm:text-sm text-nightly-celadon/70">
            Log your first event above
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3 sm:space-y-4">
        {paginatedEvents.map((event) => (
          <EventItem key={event.id} event={event} showOwner={showOwner} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-nightly-celadon/20">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={!hasPreviousPages}
            variant="ghost"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-nightly-celadon">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={!hasMorePages}
            variant="ghost"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// Memoize EventList to prevent unnecessary re-renders
export const EventList = memo(EventListComponent);
