// src/components/settings/SessionEditSection.jsx
// This component is responsible for editing the active session's start time and must adhere to the pause restriction:
// Pauses can only occur once every 12 hours; updates are blocked if a recent pause event exists.

import React, { useState } from 'react';
import { formatTime } from '../../utils';
import { getFirestore, doc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const SessionEditSection = ({
  cageOnTime,
  setCageOnTime,
  setTimeInChastity,
  editSessionDateInput,
  setEditSessionDateInput,
  editSessionTimeInput,
  setEditSessionTimeInput,
  editSessionMessage,
  setEditSessionMessage,
  isAuthReady
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const db = getFirestore();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Temporarily disabled for debug
  // if (!isCurrentSessionActive) return null;

  const handleUpdateCurrentCageOnTime = async () => {
    if (!isAuthReady || !editSessionDateInput || !editSessionTimeInput || isUpdating) return;

    setIsUpdating(true);
    setEditSessionMessage('');

    try {
      // Combine date and time inputs into a Date object (in local time)
      const newStartDateTime = new Date(`${editSessionDateInput}T${editSessionTimeInput}:00`);
      if (isNaN(newStartDateTime)) {
        setEditSessionMessage('Invalid date or time input.');
        setIsUpdating(false);
        return;
      }

      // Check pause restriction: no pause events within last 12 hours
      const eventLogRef = collection(db, 'artifacts', 'chastityandflr', 'users', userId, 'eventLog');
      const pauseQuery = query(
        eventLogRef,
        where('sessionId', '==', userId),
        where('eventType', '==', 'pause'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const pauseSnapshot = await getDocs(pauseQuery);
      if (!pauseSnapshot.empty) {
        const lastPause = pauseSnapshot.docs[0].data();
        const lastPauseTime = lastPause.timestamp.toDate();
        const now = new Date();
        const hoursSinceLastPause = (now - lastPauseTime) / (1000 * 60 * 60);
        if (hoursSinceLastPause < 12) {
          setEditSessionMessage('Cannot update start time: a pause was recorded less than 12 hours ago.');
          setIsUpdating(false);
          return;
        }
      }

      // Update the session document with new start time
      const sessionRef = doc(db, 'artifacts', 'chastityandflr', 'users', userId);
      const oldStartTime = cageOnTime ? cageOnTime.toISOString() : null;
      await setDoc(sessionRef, {
        cageOnTime: newStartDateTime
      }, { merge: true });

      // Log the change in eventLog
      await addDoc(eventLogRef, {
        sessionId: userId,
        eventType: 'startTimeEdit',
        oldStartTime,
        newStartTime: newStartDateTime.toISOString(),
        editedBy: userId ?? 'unknown',
        timestamp: serverTimestamp(),
        eventTimestamp: serverTimestamp()
      });

      // Update local state so the tracker reflects the new start time immediately
      setCageOnTime(newStartDateTime);
      setTimeInChastity(Math.max(0, Math.floor((Date.now() - newStartDateTime.getTime()) / 1000)));

      setEditSessionMessage('Start time updated successfully.');
    } catch (error) {
      setEditSessionMessage(`Error updating start time: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mb-8 px-4 py-5 sm:p-6 bg-orange-950 border border-orange-700 rounded-lg shadow">
      <h3 className="text-lg leading-6 font-medium text-orange-200 mb-3">Edit Chastity Start Time</h3>
      {cageOnTime && (
        <p className="text-sm text-orange-300 mb-4">
          Current Start: {formatTime(cageOnTime, true, true)}
        </p>
      )}
      <p className="text-sm text-orange-300 mb-4">
        Adjust the date and time when the current chastity session started. This will be recorded in the event log.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="editSessionDate" className="block text-sm font-medium text-orange-300 mb-1">New Start Date:</label>
          <input
            type="date"
            id="editSessionDate"
            value={editSessionDateInput}
            onChange={(e) => setEditSessionDateInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-orange-500 bg-gray-900 text-orange-100 text-sm focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
        <div>
          <label htmlFor="editSessionTime" className="block text-sm font-medium text-orange-300 mb-1">New Start Time:</label>
          <input
            type="time"
            id="editSessionTime"
            value={editSessionTimeInput}
            onChange={(e) => setEditSessionTimeInput(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-orange-500 bg-gray-900 text-orange-100 text-sm focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleUpdateCurrentCageOnTime}
        disabled={!isAuthReady || !editSessionDateInput || !editSessionTimeInput || isUpdating}
        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-sm py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
      >
        {isUpdating ? 'Updating...' : 'Update Start Time'}
      </button>
      {editSessionMessage && (
        <p className={`text-xs mt-2 ${editSessionMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
          {editSessionMessage}
        </p>
      )}
    </div>
  );
};

export default SessionEditSection;
