/**
 * Account Linking State Hook
 * Manages local state for account linking UI
 */
import { useState, useCallback } from "react";
import { AccountLinkingState } from "../../types/account-linking";

/**
 * Hook for managing account linking UI state
 */
export function useAccountLinkingState() {
  const [state, setState] = useState<AccountLinkingState>({
    isGeneratingCode: false,
    currentLinkCode: null,
    linkCodeError: null,
    isUsingCode: false,
    codeUsageError: null,
    adminRelationships: [],
    selectedWearerId: null,
    currentAdminSession: null,
    isAdminSessionActive: false,
    showQRCode: false,
    showDisconnectionDialog: false,
    showPermissionEditor: false,
  });

  const setSelectedWearer = useCallback((wearerId: string | null) => {
    setState((prev) => ({ ...prev, selectedWearerId: wearerId }));
  }, []);

  const toggleStateProperty = useCallback(
    (
      property: keyof Pick<
        AccountLinkingState,
        "showQRCode" | "showDisconnectionDialog" | "showPermissionEditor"
      >,
    ) => {
      setState((prev) => ({ ...prev, [property]: !prev[property] }));
    },
    [],
  );

  const toggleQRCode = useCallback(
    () => toggleStateProperty("showQRCode"),
    [toggleStateProperty],
  );

  const toggleDisconnectionDialog = useCallback(
    () => toggleStateProperty("showDisconnectionDialog"),
    [toggleStateProperty],
  );

  const togglePermissionEditor = useCallback(
    () => toggleStateProperty("showPermissionEditor"),
    [toggleStateProperty],
  );

  const clearLinkCode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentLinkCode: null,
      linkCodeError: null,
    }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentLinkCode: null,
      linkCodeError: null,
      codeUsageError: null,
    }));
  }, []);

  return {
    state,
    setState,
    setSelectedWearer,
    toggleQRCode,
    toggleDisconnectionDialog,
    togglePermissionEditor,
    clearLinkCode,
    clearAllErrors,
  };
}
