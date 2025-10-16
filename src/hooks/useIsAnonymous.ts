/**
 * Hook to check if current user is anonymous
 */
import { useState, useEffect } from "react";
import { getFirebaseAuth } from "@/services/firebase";

export const useIsAnonymous = (): boolean => {
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const checkAnonymous = async () => {
      try {
        const auth = await getFirebaseAuth();
        const firebaseUser = auth.currentUser;
        setIsAnonymous(firebaseUser?.isAnonymous ?? false);
      } catch {
        setIsAnonymous(false);
      }
    };

    checkAnonymous();
  }, []);

  return isAnonymous;
};
