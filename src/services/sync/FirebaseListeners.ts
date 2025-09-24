
/**
 * Firebase Listeners
 * Sets up real-time listeners for Firebase collections
 */
import { serviceLogger } from "@/utils/logging";
import { getFirestore, getFirebaseAuth } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const logger = serviceLogger("FirebaseListeners");

class FirebaseListeners {
  private unsubscribes: (() => void)[] = [];

  constructor() {
    logger.info("FirebaseListeners initialized");
  }

  /**
   * Start listening for changes in Firebase
   */
  start() {
    logger.info("Starting Firebase listeners");
    this.stop(); // Stop any existing listeners

    const auth = getFirebaseAuth();
    auth.then(authInstance => {
        authInstance.onAuthStateChanged(user => {
            if (user) {
                this.listenToCollection("sessions", user.uid);
                this.listenToCollection("events", user.uid);
                this.listenToCollection("tasks", user.uid);
                this.listenToCollection("goals", user.uid);
                this.listenToCollection("settings", user.uid);
            } else {
                this.stop();
            }
        });
    });
  }

  /**
   * Stop listening for changes
   */
  stop() {
    logger.info("Stopping Firebase listeners");
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes = [];
  }

  private listenToCollection(collectionName: string, userId: string) {
    getFirestore().then(firestore => {
        const q = query(
            collection(firestore, `users/${userId}/${collectionName}`)
        );
    
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.docChanges().forEach(change => {
            logger.debug(`Received real-time update for ${collectionName}`, { type: change.type, docId: change.doc.id });
            // TODO: Handle the change (update Dexie, invalidate TanStack Query cache)
            });
        });
    
        this.unsubscribes.push(unsubscribe);
    });
  }
}

export const firebaseListeners = new FirebaseListeners();
