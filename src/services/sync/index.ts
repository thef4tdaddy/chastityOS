import { FirebaseSync } from "./FirebaseSync";
import { FirebaseListeners } from "./FirebaseListeners";
import { offlineQueue } from "./OfflineQueue";

export const firebaseSync = new FirebaseSync();
export const firebaseListeners = new FirebaseListeners(firebaseSync);
export { offlineQueue };
