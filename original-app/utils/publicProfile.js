import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

export function makeProfileToken(userId, submissiveName = "") {
  const slug = submissiveName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}-${userId}`;
}

export function extractUserIdFromToken(token = "") {
  if (!token) return null;
  const lastDash = token.lastIndexOf("-");
  return lastDash === -1 ? token : token.slice(lastDash + 1);
}

export async function loadPublicProfile(userId) {
  if (!userId) return null;
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    const data = userSnap.data();

    const settings = data.settings || {};

    const sessionData = {
      isCageOn: data.isCageOn || false,
      cageOnTime: data.cageOnTime?.toDate ? data.cageOnTime.toDate() : null,
      timeInChastity: data.timeInChastity || 0,
      timeCageOff: data.timeCageOff || 0,
      totalChastityTime: data.totalChastityTime || 0,
      totalTimeCageOff: data.totalTimeCageOff || 0,
      overallTotalPauseTime: data.overallTotalPauseTime || 0,
      accumulatedPauseTimeThisSession:
        data.accumulatedPauseTimeThisSession || 0,
      livePauseDuration: data.livePauseDuration || 0,
      isPaused: data.isPaused || false,
      chastityHistory: (data.chastityHistory || []).map((p) => ({
        ...p,
        startTime: p.startTime?.toDate ? p.startTime.toDate() : null,
        endTime: p.endTime?.toDate ? p.endTime.toDate() : null,
        pauseEvents: (p.pauseEvents || []).map((ev) => ({
          ...ev,
          startTime: ev.startTime?.toDate ? ev.startTime.toDate() : null,
          endTime: ev.endTime?.toDate ? ev.endTime.toDate() : null,
        })),
      })),
    };

    const eventsSnap = await getDocs(
      query(
        collection(db, "users", userId, "sexualEventsLog"),
        orderBy("eventTimestamp", "desc"),
      ),
    );
    const events = eventsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      eventTimestamp: d.data().eventTimestamp?.toDate(),
      timestamp: d.data().timestamp?.toDate(),
    }));

    const arousalSnap = await getDocs(
      query(
        collection(db, "users", userId, "arousalLevels"),
        orderBy("timestamp", "desc"),
      ),
    );
    const arousalLevels = arousalSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate(),
    }));

    return { settings, sessionData, events, arousalLevels };
  } catch (err) {
    console.error("Failed to load public profile", err);
    return null;
  }
}
