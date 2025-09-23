import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useRules(userId, isAuthReady) {
  const [rulesText, setRulesTextState] = useState("");
  const [isRulesLoading, setIsRulesLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsRulesLoading(false);
      return;
    }
    const fetchRules = async () => {
      setIsRulesLoading(true);
      try {
        const userDocRef = doc(db, "users", userId);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          const loaded = data?.settings?.rulesText || data.rulesText || "";
          setRulesTextState(loaded);
        } else {
          setRulesTextState("");
        }
      } catch (err) {
        console.error("Error fetching rules:", err);
      } finally {
        setIsRulesLoading(false);
      }
    };
    fetchRules();
  }, [isAuthReady, userId]);

  const saveRulesText = useCallback(
    async (text) => {
      if (!isAuthReady || !userId) return;
      const normalized = text.replace(/([^\n])\n([^\n])/g, "$1\n\n$2");
      const userDocRef = doc(db, "users", userId);
      try {
        await setDoc(
          userDocRef,
          { settings: { rulesText: normalized } },
          { merge: true },
        );
        setRulesTextState(normalized);
      } catch (err) {
        console.error("Error saving rules:", err);
      }
    },
    [isAuthReady, userId],
  );

  return { rulesText, setRulesText: saveRulesText, isRulesLoading };
}
