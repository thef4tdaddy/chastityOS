import { useState, useEffect, useCallback, useMemo } from "react";
import { sha256 as generateHash } from "../utils/hash";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import * as Sentry from "@sentry/react";

export const useSettings = (userId, isAuthReady) => {
  const defaultSettings = useMemo(
    () => ({
      submissivesName: "",
      keyholderName: "",
      keyholderPasswordHash: null,
      requiredKeyholderDurationSeconds: null,
      goalDurationSeconds: null,
      rewards: [],
      punishments: [],
      isTrackingAllowed: true,
      eventDisplayMode: "kinky",
      rulesText: "",
      publicProfileEnabled: false,
      publicStatsVisibility: {
        currentStatus: true,
        totals: true,
        arousalChart: true,
        chastityHistory: true,
        sexualEvents: true,
      },
    }),
    [],
  );

  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [submissivesNameInput, setSubmissivesNameInput] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [keyholderMessage, setKeyholderMessage] = useState("");
  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);

  // Load settings
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }
    const fetchSettings = async () => {
      setIsLoading(true);
      const userDocRef = doc(db, "users", userId);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const loadedSettings = { ...defaultSettings, ...docSnap.data() };
          setSettings(loadedSettings);
          setSubmissivesNameInput(loadedSettings.submissivesName || "");
        } else {
          await setDoc(userDocRef, defaultSettings, { merge: true });
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        Sentry.captureException?.(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [isAuthReady, userId, defaultSettings]);

  const saveSettingsToFirestore = useCallback(
    async (settingsToSave) => {
      if (!isAuthReady || !userId) return;
      const docRef = doc(db, "users", userId);
      try {
        await setDoc(docRef, settingsToSave, { merge: true });
        setSettings((prev) => ({ ...prev, ...settingsToSave }));
      } catch (error) {
        console.error("Error saving settings to Firestore:", error);
        Sentry.captureException?.(error);
      }
    },
    [isAuthReady, userId],
  );

  const updateSettings = useCallback(
    (value) => {
      if (typeof value === "function") {
        setSettings((prev) => {
          const newState = value(prev);
          saveSettingsToFirestore(newState);
          return newState;
        });
      } else {
        setSettings(value);
        saveSettingsToFirestore(value);
      }
    },
    [saveSettingsToFirestore],
  );

  const handleSubmissivesNameInputChange = (e) => {
    setSubmissivesNameInput(e.target.value);
  };

  const handleSetSubmissivesName = useCallback(() => {
    updateSettings((prev) => ({
      ...prev,
      submissivesName: submissivesNameInput,
    }));
    setNameMessage("Name updated successfully!");
    setTimeout(() => setNameMessage(""), 3000);
  }, [submissivesNameInput, updateSettings]);

  const handleSetEventDisplayMode = useCallback(
    (mode) => {
      updateSettings((prev) => ({ ...prev, eventDisplayMode: mode }));
    },
    [updateSettings],
  );

  const togglePublicProfileEnabled = useCallback(() => {
    updateSettings((prev) => ({
      ...prev,
      publicProfileEnabled: !prev.publicProfileEnabled,
    }));
  }, [updateSettings]);

  const togglePublicStatVisibility = useCallback(
    (key) => {
      updateSettings((prev) => ({
        ...prev,
        publicStatsVisibility: {
          ...prev.publicStatsVisibility,
          [key]: !prev.publicStatsVisibility?.[key],
        },
      }));
    },
    [updateSettings],
  );

  // Keyholder logic
  const handleSetKeyholder = useCallback(
    async (name) => {
      const khName = name.trim();
      if (!khName) {
        setKeyholderMessage("Keyholder name cannot be empty.");
        return null;
      }
      const hash = await generateHash(userId + khName);
      const preview = hash.substring(0, 8).toUpperCase();

      await saveSettingsToFirestore({
        keyholderName: khName,
        keyholderPasswordHash: hash,
        requiredKeyholderDurationSeconds: null,
      });

      setIsKeyholderModeUnlocked(false);
      setKeyholderMessage(
        `Keyholder "${khName}" set. Password preview: ${preview}`,
      );
      return preview;
    },
    [userId, saveSettingsToFirestore],
  );

  const handleClearKeyholder = useCallback(async () => {
    await saveSettingsToFirestore({
      keyholderName: "",
      keyholderPasswordHash: null,
      requiredKeyholderDurationSeconds: null,
    });
    setIsKeyholderModeUnlocked(false);
    setKeyholderMessage("Keyholder data cleared.");
  }, [saveSettingsToFirestore]);

  const handleUnlockKeyholderControls = useCallback(
    async (enteredPasswordPreview) => {
      if (!settings.keyholderPasswordHash) {
        setKeyholderMessage("Keyholder not fully set up.");
        return false;
      }
      const expectedPreview = settings.keyholderPasswordHash
        .substring(0, 8)
        .toUpperCase();
      if (enteredPasswordPreview.toUpperCase() === expectedPreview) {
        setIsKeyholderModeUnlocked(true);
        setKeyholderMessage("Keyholder controls unlocked.");
        return true;
      }
      setKeyholderMessage("Incorrect Keyholder password.");
      return false;
    },
    [settings.keyholderPasswordHash],
  );

  const handleLockKeyholderControls = useCallback(() => {
    setIsKeyholderModeUnlocked(false);
    setKeyholderMessage("Keyholder controls locked.");
  }, []);

  return {
    settings,
    isLoading,
    setSettings: updateSettings,
    savedSubmissivesName: settings.submissivesName,
    submissivesNameInput,
    handleSubmissivesNameInputChange,
    handleSetSubmissivesName,
    nameMessage,
    eventDisplayMode: settings.eventDisplayMode,
    handleSetEventDisplayMode,
    publicProfileEnabled: settings.publicProfileEnabled,
    publicStatsVisibility: settings.publicStatsVisibility,
    togglePublicProfileEnabled,
    togglePublicStatVisibility,
    keyholderMessage,
    isKeyholderModeUnlocked,
    handleSetKeyholder,
    handleClearKeyholder,
    handleUnlockKeyholderControls,
    handleLockKeyholderControls,
    saveSettingsToFirestore,
  };
};
