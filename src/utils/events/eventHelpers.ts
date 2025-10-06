/**
 * Event helper utilities for combining and processing event data
 */

interface EventWithOwner {
  timestamp: Date | number;
  ownerName?: string;
  ownerId?: string;
  [key: string]: unknown;
}

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
export const combineAndSortEvents = (
  userEvents: unknown[],
  submissiveEvents: unknown[],
  ownerInfo: EventOwnerInfo,
): EventWithOwner[] => {
  const userEventsWithOwner = userEvents.map((e) => ({
    ...e,
    ownerName: ownerInfo.userName,
    ownerId: ownerInfo.userId,
  }));

  const submissiveEventsWithOwner = submissiveEvents.map((e) => ({
    ...e,
    ownerName: ownerInfo.submissiveName,
    ownerId: ownerInfo.submissiveId,
  }));

  const allEvents = [...userEventsWithOwner, ...submissiveEventsWithOwner];

  return allEvents.sort((a, b) => {
    const timeA = getTimestampValue(a.timestamp);
    const timeB = getTimestampValue(b.timestamp);
    return timeB - timeA; // Most recent first
  });
};
