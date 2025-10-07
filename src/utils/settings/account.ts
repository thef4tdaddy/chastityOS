/**
 * Account Settings Utils - Helper functions for useAccountSettings
 */

import { type Dispatch, type SetStateAction } from "react";
import type { AccountData } from "../../hooks/features/useAccountSettings";

type AsyncHandler<T = void> = () => Promise<T>;

export const withErrorHandling = async <T>(
  handler: AsyncHandler<T>,
  setIsUpdating: (v: boolean) => void,
  setError: (e: Error | null) => void,
  errorMessage: string,
): Promise<T> => {
  setIsUpdating(true);
  setError(null);
  try {
    return await handler();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(errorMessage);
    setError(error);
    throw error;
  } finally {
    setIsUpdating(false);
  }
};

export const withDeletionHandling = async (
  handler: () => Promise<void>,
  setIsDeleting: (v: boolean) => void,
  setError: (e: Error | null) => void,
  errorMessage: string,
): Promise<void> => {
  setIsDeleting(true);
  setError(null);
  try {
    await handler();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(errorMessage);
    setError(error);
    throw error;
  } finally {
    setIsDeleting(false);
  }
};

export const handleEmailUpdate = async (
  email: string,
  setAccount: Dispatch<SetStateAction<AccountData>>,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  setAccount((prev) => ({ ...prev, email }));
};

export const handlePasswordUpdate = async (
  _oldPassword: string,
  _newPassword: string,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
};

export const handle2FAEnable = async (
  setQrCode: (qr: string | null) => void,
  setAccount: Dispatch<SetStateAction<AccountData>>,
): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const mockQR = "data:image/png;base64,mock-qr-code";
  setQrCode(mockQR);
  setAccount((prev) => ({ ...prev, has2FA: true }));
  return mockQR;
};

export const handle2FADisable = async (
  _code: string,
  setQrCode: (qr: string | null) => void,
  setAccount: Dispatch<SetStateAction<AccountData>>,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  setAccount((prev) => ({ ...prev, has2FA: false }));
  setQrCode(null);
};

export const handleAccountDelete = async (_password: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
};
