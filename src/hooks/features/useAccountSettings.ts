/**
 * Account Settings Hook - Extracts account management from AccountSection component
 */

import { useState, useCallback } from "react";

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

  const updateEmail = useCallback(async (email: string): Promise<void> => {
    setIsUpdating(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setAccount((prev) => ({ ...prev, email }));
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to update email");
      setError(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const updatePassword = useCallback(
    async (_oldPassword: string, _newPassword: string): Promise<void> => {
      setIsUpdating(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update password");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const enable2FA = useCallback(async (): Promise<string> => {
    setIsUpdating(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const mockQR = "data:image/png;base64,mock-qr-code";
      setQrCode(mockQR);
      setAccount((prev) => ({ ...prev, has2FA: true }));
      return mockQR;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to enable 2FA");
      setError(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const disable2FA = useCallback(async (_code: string): Promise<void> => {
    setIsUpdating(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setAccount((prev) => ({ ...prev, has2FA: false }));
      setQrCode(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to disable 2FA");
      setError(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteAccount = useCallback(
    async (_password: string): Promise<void> => {
      setIsDeleting(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to delete account");
        setError(error);
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [],
  );

  useState(() => {
    setTimeout(() => setIsLoading(false), 100);
  });

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
