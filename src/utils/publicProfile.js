// This file contains utility functions for handling public profiles in a chastity app.
const safeToDate = (v) => (v && typeof v.toDate === 'function') ? v.toDate() : null;
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function makeProfileToken(userId, submissiveName = '') {
  const slug = submissiveName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}-${userId}`;
}

export function extractUserIdFromToken(token = '') {
  if (!token) return null;
  const lastDash = token.lastIndexOf('-');
  return lastDash === -1 ? token : token.slice(lastDash + 1);
}

export async function loadPublicProfile(userId) {
  if (!userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    const data = userSnap.data();

    const settings = data.settings || {};

    const sessionData = {
      isCageOn: data.isCageOn || false,
      cageOnTime: safeToDate(data.cageOnTime),
      timeInChastity: data.timeInChastity || 0,
      timeCageOff: data.timeCageOff || 0,
      totalChastityTime: data.totalChastityTime || 0,
      totalTimeCageOff: data.totalTimeCageOff || 0,
      overallTotalPauseTime: data.overallTotalPauseTime || 0,
      accumulatedPauseTimeThisSession: data.accumulatedPauseTimeThisSession || 0,
      livePauseDuration: data.livePauseDuration || 0,
      isPaused: data.isPaused || false,
      chastityHistory: (data.chastityHistory || []).map((p) => ({
        ...p,
        startTime: safeToDate(p.startTime),
        endTime: safeToDate(p.endTime),
        pauseEvents: (p.pauseEvents || []).map((ev) => ({
          ...ev,
          startTime: safeToDate(ev.startTime),
          endTime: safeToDate(ev.endTime),
        })),
      })),
    };

    const eventsSnap = await getDocs(query(collection(db, 'users', userId, 'sexualEventsLog'), orderBy('eventTimestamp', 'desc')));
    const events = eventsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      eventTimestamp: safeToDate(d.data().eventTimestamp),
      timestamp: safeToDate(d.data().timestamp),
    }));

    const arousalSnap = await getDocs(query(collection(db, 'users', userId, 'arousalLevels'), orderBy('timestamp', 'desc')));
    const arousalLevels = arousalSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: safeToDate(d.data().timestamp),
    }));

    return { settings, sessionData, events, arousalLevels };
  } catch (err) {
    console.error('Failed to load public profile', err);
    return null;
  }
}
