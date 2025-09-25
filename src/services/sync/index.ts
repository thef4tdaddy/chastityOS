import { FirebaseSync } from "./FirebaseSync";
import { FirebaseListeners } from "./FirebaseListeners";

export const firebaseSync = new FirebaseSync();
export const firebaseListeners = new FirebaseListeners(firebaseSync);
