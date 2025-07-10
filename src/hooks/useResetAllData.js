import { useCallback } from "react";
import { auth, db } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";

export function useResetAllData() {
  const resetAll = useCallback(async () => {
    const currentUser = await new Promise((resolve) => {
      const existingUser = auth.currentUser;
      if (existingUser) {
        resolve(existingUser);
      } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      }
    });

    if (!currentUser?.uid) {
      console.error("No active user ID. Cannot reset.");
      return;
    }

    try {
      console.warn("ResetAll: Deleting user Firestore document...");
      await deleteDoc(doc(db, "users", currentUser.uid));

      console.warn("ResetAll: Signing out user...");
      await auth.signOut();

      console.warn("ResetAll: Broadcasting reset event...");
      window.dispatchEvent(new Event("chastityOS_nuke"));

      console.log("ResetAll: All data has been reset.");
    } catch (err) {
      console.error("ResetAll: Error resetting data:", err);
    }
  }, []);

  return resetAll;
}