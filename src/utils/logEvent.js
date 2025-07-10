import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { eventTypes } from './eventTypes';

/**
 * Logs an automated system event to the user's 'eventLog' collection in Firestore.
 * @param {string} userId - The ID of the user for whom the event is being logged.
 * @param {string} eventType - The type of the event (e.g., 'PERSONAL_GOAL_SET').
 * @param {object} details - An object containing any relevant details about the event.
 */
export const logEvent = async (userId, eventType, details = {}) => {
  if (!userId) {
    console.error("Cannot log event: A user ID must be provided.");
    return;
  }
  try {
    // Defines the path to the user-specific event log collection
    const eventLogCollection = collection(db, 'users', userId, 'eventLog');
    
    const eventData = {
      timestamp: serverTimestamp(),
      type: eventType,
      details: details,
      // Finds the display-friendly text for the event from our definitions
      text: Object.values(eventTypes).find(e => e.type === eventType)?.text || 'Unknown Event',
    };

    // Adds the new event document to Firestore
    await addDoc(eventLogCollection, eventData);
  } catch (error) {
    console.error("Error logging event:", error);
  }
};
