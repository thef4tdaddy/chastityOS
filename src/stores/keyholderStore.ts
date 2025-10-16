/**
 * Keyholder Store
 * UI state management for keyholder mode functionality
 * Zustand store - handles keyholder UI state only
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { sha256 } from "@/utils/helpers/hash";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("KeyholderStore");

// Helper functions for password operations
const handlePasswordCheck = async (
  passwordAttempt: string,
  storedHash: string,
  set: (state: Partial<KeyholderState>) => void,
  get: () => KeyholderState,
) => {
  const state = get();

  if (state.isCheckingPassword) {
    logger.debug("Password check already in progress");
    return;
  }

  set({ isCheckingPassword: true, keyholderMessage: "" });

  try {
    logger.debug("Checking keyholder password");

    if (!storedHash) {
      const message = "Error: No keyholder password is set in the database.";
      set({
        keyholderMessage: message,
        isCheckingPassword: false,
      });
      logger.warn("No keyholder password hash found");
      return;
    }

    const attemptHash = await sha256(passwordAttempt);

    if (attemptHash === storedHash) {
      set({
        isKeyholderModeUnlocked: true,
        keyholderMessage: "Controls are now unlocked.",
        isPasswordDialogOpen: false,
        passwordAttempt: "",
        isCheckingPassword: false,
      });
      logger.info("Keyholder password correct, mode unlocked");
    } else {
      set({
        keyholderMessage: "Incorrect password. Please try again.",
        passwordAttempt: "",
        isCheckingPassword: false,
      });
      logger.warn("Incorrect keyholder password attempt");
    }
  } catch (error) {
    const message = "Failed to check password. Please try again.";
    set({
      keyholderMessage: message,
      isCheckingPassword: false,
    });
    logger.error("Error checking keyholder password", {
      error: error as Error,
    });
  }
};

const handlePasswordSet = async (
  newPassword: string,
  onSave: (hash: string) => Promise<void>,
  set: (state: Partial<KeyholderState>) => void,
  get: () => KeyholderState,
) => {
  const state = get();

  if (state.isSavingPassword) {
    logger.debug("Password save already in progress");
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    set({
      keyholderMessage: "Password must be at least 6 characters long.",
    });
    return;
  }

  set({ isSavingPassword: true, keyholderMessage: "" });

  try {
    logger.debug("Setting permanent keyholder password");

    const newHash = await sha256(newPassword);
    await onSave(newHash);

    set({
      keyholderMessage: "Permanent password has been updated successfully!",
      newPassword: "",
      confirmPassword: "",
      isPasswordSettingMode: false,
      isPasswordDialogOpen: false,
      isSavingPassword: false,
    });

    logger.info("Permanent keyholder password updated successfully");
  } catch (error) {
    const message = "Failed to update password. Please try again.";
    set({
      keyholderMessage: message,
      isSavingPassword: false,
    });
    logger.error("Error setting permanent password", {
      error: error as Error,
    });
  }
};

export interface KeyholderState {
  // UI State
  isKeyholderModeUnlocked: boolean;
  keyholderMessage: string;
  isPasswordDialogOpen: boolean;
  isPasswordSettingMode: boolean;

  // Form State
  passwordAttempt: string;
  newPassword: string;
  confirmPassword: string;

  // Loading States
  isCheckingPassword: boolean;
  isSavingPassword: boolean;
}

export interface KeyholderActions {
  // Password Management
  checkPassword: (passwordAttempt: string, storedHash: string) => Promise<void>;
  setTempPassword: (keyholderName: string) => Promise<string>;
  setPermanentPassword: (
    newPassword: string,
    onSave: (hash: string) => Promise<void>,
  ) => Promise<void>;

  // UI Actions
  unlockKeyholderMode: () => void;
  lockKeyholderControls: () => void;
  setMessage: (message: string) => void;
  clearMessage: () => void;

  // Dialog Management
  openPasswordDialog: () => void;
  closePasswordDialog: () => void;
  setPasswordSettingMode: (isSettingMode: boolean) => void;

  // Form Actions
  setPasswordAttempt: (password: string) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  clearForm: () => void;

  // Reset
  resetStore: () => void;
}

export interface KeyholderStore extends KeyholderState, KeyholderActions {}

const initialState: KeyholderState = {
  isKeyholderModeUnlocked: false,
  keyholderMessage: "",
  isPasswordDialogOpen: false,
  isPasswordSettingMode: false,
  passwordAttempt: "",
  newPassword: "",
  confirmPassword: "",
  isCheckingPassword: false,
  isSavingPassword: false,
};

export const useKeyholderStore = create<KeyholderStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Password Management
      checkPassword: async (passwordAttempt: string, storedHash: string) => {
        await handlePasswordCheck(passwordAttempt, storedHash, set, get);
      },

      setTempPassword: async (keyholderName: string): Promise<string> => {
        try {
          logger.debug("Generating temporary keyholder password", {
            keyholderName,
          });

          const tempPassword = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
          const message = `Your keyholder password is: ${tempPassword}. This is now the permanent password unless you set a custom one.`;

          set({ keyholderMessage: message });

          logger.info("Temporary keyholder password generated");
          return tempPassword;
        } catch (error) {
          const message = "Failed to generate temporary password.";
          set({ keyholderMessage: message });
          logger.error("Error generating temporary password", {
            error: error as Error,
          });
          throw error;
        }
      },

      setPermanentPassword: async (
        newPassword: string,
        onSave: (hash: string) => Promise<void>,
      ) => {
        await handlePasswordSet(newPassword, onSave, set, get);
      },

      // UI Actions
      unlockKeyholderMode: () => {
        set({
          isKeyholderModeUnlocked: true,
          keyholderMessage: "Controls are now unlocked.",
          isPasswordDialogOpen: false,
        });
        logger.info("Keyholder mode unlocked manually");
      },

      lockKeyholderControls: () => {
        set({
          isKeyholderModeUnlocked: false,
          keyholderMessage: "",
          isPasswordDialogOpen: false,
          passwordAttempt: "",
          newPassword: "",
          confirmPassword: "",
        });
        logger.info("Keyholder controls locked");
      },

      setMessage: (message: string) => {
        set({ keyholderMessage: message });
      },

      clearMessage: () => {
        set({ keyholderMessage: "" });
      },

      // Dialog Management
      openPasswordDialog: () => {
        set({
          isPasswordDialogOpen: true,
          keyholderMessage: "",
          passwordAttempt: "",
        });
      },

      closePasswordDialog: () => {
        set({
          isPasswordDialogOpen: false,
          passwordAttempt: "",
          newPassword: "",
          confirmPassword: "",
          isPasswordSettingMode: false,
        });
      },

      setPasswordSettingMode: (isSettingMode: boolean) => {
        set({
          isPasswordSettingMode: isSettingMode,
          keyholderMessage: "",
          passwordAttempt: "",
          newPassword: "",
          confirmPassword: "",
        });
      },

      // Form Actions
      setPasswordAttempt: (password: string) => {
        set({ passwordAttempt: password });
      },

      setNewPassword: (password: string) => {
        set({ newPassword: password });
      },

      setConfirmPassword: (password: string) => {
        set({ confirmPassword: password });
      },

      clearForm: () => {
        set({
          passwordAttempt: "",
          newPassword: "",
          confirmPassword: "",
          keyholderMessage: "",
        });
      },

      // Reset
      resetStore: () => {
        set(initialState);
        logger.debug("Keyholder store reset to initial state");
      },
    }),
    {
      name: "keyholder-store",
      // Only enable devtools in development
      enabled:
        import.meta.env.MODE === "development" ||
        import.meta.env.MODE === "nightly",
    },
  ),
);
