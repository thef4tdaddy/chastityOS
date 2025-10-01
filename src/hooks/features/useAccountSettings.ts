/**
 * Account Settings Hook - Extracts account management from AccountSection component
 */

import { useState, useCallback } from "react";
import {
  withErrorHandling,
  withDeletionHandling,
  handleEmailUpdate,
  handlePasswordUpdate,
  handle2FAEnable,
  handle2FADisable,
  handleAccountDelete,
} from "./account-settings-utils";

export interface AccountData {
  email: string;
  has2FA: boolean;
}

export interface UseAccountSettingsReturn {
  account: AccountData;
  isLoading: boolean;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  enable2FA: () => Promise<string>;
  disable2FA: (code: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  error: Error | null;
  has2FA: boolean;
  qrCode: string | null;
}

export function useAccountSettings(): UseAccountSettingsReturn {
  const [account, setAccount] = useState<AccountData>({
    email: "",
    has2FA: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const updateEmail = useCallback(
    async (email: string): Promise<void> =>
      withErrorHandling(
        () => handleEmailUpdate(email, setAccount),
        setIsUpdating,
        setError,
        "Failed to update email",
      ),
    [],
  );
  const updatePassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<void> =>
      withErrorHandling(
        () => handlePasswordUpdate(oldPassword, newPassword),
        setIsUpdating,
        setError,
        "Failed to update password",
      ),
    [],
  );
  const enable2FA = useCallback(
    async (): Promise<string> =>
      withErrorHandling(
        () => handle2FAEnable(setQrCode, setAccount),
        setIsUpdating,
        setError,
        "Failed to enable 2FA",
      ),
    [],
  );
  const disable2FA = useCallback(
    async (code: string): Promise<void> =>
      withErrorHandling(
        () => handle2FADisable(code, setQrCode, setAccount),
        setIsUpdating,
        setError,
        "Failed to disable 2FA",
      ),
    [],
  );
  const deleteAccount = useCallback(
    async (password: string): Promise<void> =>
      withDeletionHandling(
        () => handleAccountDelete(password),
        setIsDeleting,
        setError,
        "Failed to delete account",
      ),
    [],
  );
  useState(() => setTimeout(() => setIsLoading(false), 100));
  return {
    account,
    isLoading,
    updateEmail,
    updatePassword,
    enable2FA,
    disable2FA,
    deleteAccount,
    isUpdating,
    isDeleting,
    error,
    has2FA: account.has2FA,
    qrCode,
  };
}
