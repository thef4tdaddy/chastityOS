/**
 * Multi-wearer Firestore operation helpers
 */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  DocumentReference as _DocumentReference,
  CollectionReference,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";
import { MultiWearerSession, Wearer, KeyholderPermissions } from "../../types";

export const defaultPermissions: KeyholderPermissions = {
  canApproveTasks: false,
  canAddPunishments: false,
  canAddRewards: false,
  canModifyDuration: false,
  canLockControls: false,
};

// Helper to get multi-wearer collection reference
export function getMultiWearerCollectionRef(): CollectionReference {
  return collection(db, "multiWearerSessions");
}

// Helper to get wearers collection reference
export function getWearersCollectionRef(
  sessionId: string,
): CollectionReference {
  return collection(db, "multiWearerSessions", sessionId, "wearers");
}

// Helper to find active session
export async function findActiveSession(
  keyholderUserId: string,
): Promise<{ id: string; data: MultiWearerSession } | null> {
  const multiWearerCollectionRef = getMultiWearerCollectionRef();
  const q = query(
    multiWearerCollectionRef,
    where("keyholderUserId", "==", keyholderUserId),
    where("isActive", "==", true),
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const sessionDoc = querySnapshot.docs[0];
  return {
    id: sessionDoc.id,
    data: sessionDoc.data() as MultiWearerSession,
  };
}

// Helper to create a new session
export async function createMultiWearerSession(
  keyholderUserId: string,
): Promise<void> {
  const multiWearerCollectionRef = getMultiWearerCollectionRef();
  const sessionData = {
    keyholderUserId,
    isActive: true,
    createdAt: new Date(),
    lastUpdated: new Date(),
  };

  await addDoc(multiWearerCollectionRef, sessionData);
}

// Helper to end a session
export async function endMultiWearerSession(
  keyholderUserId: string,
): Promise<void> {
  const sessionInfo = await findActiveSession(keyholderUserId);
  if (sessionInfo) {
    const sessionRef = doc(db, "multiWearerSessions", sessionInfo.id);
    await updateDoc(sessionRef, {
      isActive: false,
      lastUpdated: new Date(),
    });
  }
}

// Helper to add a wearer
export async function addWearerToSession(
  keyholderUserId: string,
  wearerData: Omit<Wearer, "id">,
): Promise<void> {
  const sessionInfo = await findActiveSession(keyholderUserId);
  if (!sessionInfo) {
    throw new Error("No active session found");
  }

  const wearersCollectionRef = getWearersCollectionRef(sessionInfo.id);
  const newWearerData = {
    ...wearerData,
    keyholderPermissions: {
      ...defaultPermissions,
      ...wearerData.keyholderPermissions,
    },
    createdAt: new Date(),
  };

  await addDoc(wearersCollectionRef, newWearerData);
}

// Helper to remove a wearer
export async function removeWearerFromSession(
  keyholderUserId: string,
  wearerId: string,
): Promise<void> {
  const sessionInfo = await findActiveSession(keyholderUserId);
  if (!sessionInfo) {
    return;
  }

  const wearerDocRef = doc(
    db,
    "multiWearerSessions",
    sessionInfo.id,
    "wearers",
    wearerId,
  );
  await deleteDoc(wearerDocRef);
}

// Helper to update a wearer
export async function updateWearerInSession(
  keyholderUserId: string,
  wearerId: string,
  updates: Partial<Wearer>,
): Promise<void> {
  const sessionInfo = await findActiveSession(keyholderUserId);
  if (!sessionInfo) {
    return;
  }

  const wearerDocRef = doc(
    db,
    "multiWearerSessions",
    sessionInfo.id,
    "wearers",
    wearerId,
  );
  await updateDoc(wearerDocRef, {
    ...updates,
    lastUpdated: new Date(),
  });
}

// Helper to parse wearer document data
export function parseWearerData(wearerDoc: DocumentSnapshot): Wearer {
  const wearerData = wearerDoc.data();
  return {
    id: wearerDoc.id,
    name: wearerData.name || "",
    email: wearerData.email,
    isActive: wearerData.isActive || false,
    sessionData: wearerData.sessionData || {},
    tasks: wearerData.tasks || [],
    keyholderPermissions: {
      ...defaultPermissions,
      ...wearerData.keyholderPermissions,
    },
  };
}

// Helper to parse session data
export function parseSessionData(
  sessionDoc: DocumentSnapshot,
): MultiWearerSession {
  const data = sessionDoc.data();
  return {
    keyholderUserId: data.keyholderUserId,
    wearers: [],
    isActive: data.isActive || false,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastUpdated: data.lastUpdated?.toDate() || new Date(),
  };
}
