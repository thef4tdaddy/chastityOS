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

// Event Skeleton Loader Component
const EventSkeletonItem: React.FC = () => (
  <div className="event-skeleton-item bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 animate-pulse">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-5 h-5 bg-white/10 rounded-full flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-1/4"></div>
      </div>
    </div>
    <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
    <div className="h-3 bg-white/10 rounded w-4/5 mb-3"></div>
    <div className="flex gap-2">
      <div className="h-3 bg-white/10 rounded w-16"></div>
      <div className="h-3 bg-white/10 rounded w-20"></div>
    </div>
  </div>
);

export const EventListSkeleton: React.FC<{ count?: number }> = ({
  count = 3,
}) => (
  <div className="space-y-3 sm:space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <EventSkeletonItem key={index} />
    ))}
  </div>
);

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

  const isMilestone = event.type === "milestone";

  return (
    <article
      className={`event-item bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 ${isMilestone ? "event-milestone animate-milestone-glow" : ""}`}
      role="article"
      aria-label={`${eventTypeInfo.label} event${showOwner && event.ownerName ? ` by ${event.ownerName}` : ""} on ${formattedDate}${event.isPrivate ? ", marked as private" : ""}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Icon
            className={`${eventTypeInfo.color} text-lg sm:text-xl flex-shrink-0 transition-transform hover:scale-110`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-nighty-honeydew text-sm sm:text-base">
                {eventTypeInfo.label}
              </h3>
              {showOwner && event.ownerName && (
                <span
                  className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-2 py-0.5 text-xs rounded whitespace-nowrap"
                  role="note"
                  aria-label={`Owner: ${event.ownerName}`}
                >
                  {event.ownerName}
                </span>
              )}
            </div>
            <time
              className="text-xs text-nightly-celadon break-words"
              dateTime={event.timestamp.toISOString()}
            >
              {formattedDate}
            </time>
          </div>
        </div>
        {event.isPrivate && (
          <span
            className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded whitespace-nowrap self-start"
            role="note"
            aria-label="Private event"
          >
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
        <div
          className="flex flex-wrap gap-1.5 sm:gap-2 mt-3"
          role="list"
          aria-label="Event tags"
        >
          {event.details.tags.map((tag, index) => (
            <span
              key={index}
              role="listitem"
              className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-2 py-1 text-xs rounded whitespace-nowrap transition-all hover:bg-nightly-aquamarine/30"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
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
      <div className="space-y-4" role="status">
        <div className="text-center py-6 sm:py-8 animate-fade-in">
          <FaCalendar
            className="text-3xl sm:text-4xl text-nightly-celadon/50 mb-3 sm:mb-4 mx-auto"
            aria-hidden="true"
          />
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
      <div
        className="space-y-3 sm:space-y-4"
        role="feed"
        aria-label="Event list"
      >
        {paginatedEvents.map((event) => (
          <EventItem key={event.id} event={event} showOwner={showOwner} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between mt-6 pt-4 border-t border-nightly-celadon/20"
          aria-label="Event list pagination"
        >
          <Button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={!hasPreviousPages}
            variant="ghost"
            size="sm"
            aria-label={`Go to previous page, currently on page ${currentPage + 1} of ${totalPages}`}
          >
            Previous
          </Button>
          <span
            className="text-sm text-nightly-celadon"
            aria-current="page"
            aria-live="polite"
          >
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={!hasMorePages}
            variant="ghost"
            size="sm"
            aria-label={`Go to next page, currently on page ${currentPage + 1} of ${totalPages}`}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
};

// Memoize EventList to prevent unnecessary re-renders
export const EventList = memo(EventListComponent);
