/**
 * Event helper utilities for combining and processing event data
 */

// Base event type with required properties for sorting
interface BaseEvent {
  timestamp: Date | number;
  [key: string]: unknown;
}

// Type for an event that has been enriched with owner information
export type EventWithOwner<T extends BaseEvent> = T & {
  ownerName?: string;
  ownerId?: string;
};

interface EventOwnerInfo {
  userName: string;
  userId?: string;
  submissiveName: string;
  submissiveId?: string;
}

/**
 * Get timestamp value from event
 */
const getTimestampValue = (timestamp: Date | number): number => {
  return timestamp instanceof Date ? timestamp.getTime() : timestamp;
};

/**
 * Combine and sort events from multiple sources by timestamp
 * @param userEvents - Events from the primary user
 * @param submissiveEvents - Events from the submissive user
 * @param ownerInfo - Information about event owners
 * @returns Combined and sorted array of events
 */
export const combineAndSortEvents = <T extends BaseEvent>(
  userEvents: T[],
  submissiveEvents: T[],
  ownerInfo: EventOwnerInfo,
): EventWithOwner<T>[] => {
  const userEventsWithOwner: EventWithOwner<T>[] = userEvents.map((e) => ({
    ...e,
    ownerName: ownerInfo.userName,
    ownerId: ownerInfo.userId,
  }));

  const submissiveEventsWithOwner: EventWithOwner<T>[] = submissiveEvents.map(
    (e) => ({
      ...e,
      ownerName: ownerInfo.submissiveName,
      ownerId: ownerInfo.submissiveId,
    }),
  );

  const allEvents = [...userEventsWithOwner, ...submissiveEventsWithOwner];

  return allEvents.sort((a, b) => {
    const timeA = getTimestampValue(a.timestamp);
    const timeB = getTimestampValue(b.timestamp);
    return timeB - timeA; // Most recent first
  });
};
