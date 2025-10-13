/**
 * Firebase Listeners
 * Sets up real-time listeners for Firebase collections
 */
import { serviceLogger } from "@/utils/logging";
import { getFirestore, getFirebaseAuth } from "../firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import type { FirebaseSync } from "./FirebaseSync";

const logger = serviceLogger("FirebaseListeners");

export class FirebaseListeners {
  private unsubscribes: (() => void)[] = [];
  private firebaseSync: FirebaseSync;

  constructor(firebaseSync: FirebaseSync) {
    this.firebaseSync = firebaseSync;
    logger.info("FirebaseListeners initialized");
  }

  /**
   * Start listening for changes in Firebase
   */
  start() {
    logger.info("Starting Firebase listeners");
    this.stop(); // Stop any existing listeners

    const auth = getFirebaseAuth();
    auth.then((authInstance) => {
      authInstance.onAuthStateChanged((user) => {
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
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes = [];
  }

  private listenToCollection(collectionName: string, userId: string) {
    getFirestore().then((firestore) => {
      const q = query(
        collection(firestore, `users/${userId}/${collectionName}`),
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const changes = querySnapshot
          .docChanges()
          .map((change) => ({ id: change.doc.id, ...change.doc.data() }));
        if (changes.length > 0) {
          logger.debug(
            `Received ${changes.length} real-time updates for ${collectionName}`,
          );
          this.firebaseSync.applyRemoteChanges(collectionName, changes as any);
        }
      });

      this.unsubscribes.push(unsubscribe);
    });
  }
}
