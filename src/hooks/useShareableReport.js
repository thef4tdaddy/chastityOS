import { useState } from 'react';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * A hook to manage the creation of temporary, shareable reports.
 * @returns {object} An object containing the function to create a report and the loading/error states.
 */
export const useShareableReport = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Creates a new shareable report document in Firestore.
   * @param {object} reportData - The verbose report data object to be shared.
   * @returns {string|null} The ID of the newly created shareable report, or null if an error occurred.
   */
  const createShareableReport = async (reportData) => {
    setIsCreating(true);
    setError(null);
    try {
      const db = getFirestore();
      const reportsCollection = collection(db, 'sharedReports');

      // Set an expiration time 24 hours from now
      const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);

      // Add the new document to the 'sharedReports' collection
      const docRef = await addDoc(reportsCollection, {
        data: reportData,
        createdAt: Timestamp.now(),
        expiresAt: expiresAt,
      });

      setIsCreating(false);
      // Return the unique ID of the document
      return docRef.id;
    } catch (err) {
      console.error("Error creating shareable report:", err);
      setError("Could not create shareable link. Please try again.");
      setIsCreating(false);
      return null;
    }
  };

  return { createShareableReport, isCreating, error };
};
