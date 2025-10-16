/**
 * Account Linking Effects Hook
 * Manages side effects for account linking state synchronization
 */
import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type {
  LinkCodeResponse,
  AdminRelationship,
  AdminSession,
  GenerateLinkCodeRequest,
  UseLinkCodeRequest,
  AccountLinkingState,
} from "../../types/account-linking";
import type { ApiResponse } from "../../types";

/**
 * Hook for synchronizing mutation state with local UI state
 */
export function useAccountLinkingEffects(
  generateLinkCodeMutation: UseMutationResult<
    ApiResponse<LinkCodeResponse>,
    Error,
    GenerateLinkCodeRequest,
    unknown
  >,
  useLinkCodeMutation: UseMutationResult<
    ApiResponse<AdminRelationship>,
    Error,
    UseLinkCodeRequest,
    unknown
  >,
  startAdminSessionMutation: UseMutationResult<
    ApiResponse<AdminSession>,
    Error,
    string,
    unknown
  >,
  setState: Dispatch<SetStateAction<AccountLinkingState>>,
) {
  // Sync generate link code mutation state
  useEffect(() => {
    if (generateLinkCodeMutation.isPending) {
      setState((prev) => ({
        ...prev,
        isGeneratingCode: true,
        linkCodeError: null,
      }));
    } else if (generateLinkCodeMutation.isSuccess) {
      const response = generateLinkCodeMutation.data;
      if (response?.success && response.data) {
        setState((prev) => ({
          ...prev,
          currentLinkCode: response.data!,
          isGeneratingCode: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          linkCodeError: response?.error || "Failed to generate link code",
          isGeneratingCode: false,
        }));
      }
    } else if (generateLinkCodeMutation.isError) {
      setState((prev) => ({
        ...prev,
        linkCodeError: generateLinkCodeMutation.error?.message || "Error",
        isGeneratingCode: false,
      }));
    }
  }, [
    generateLinkCodeMutation.isPending,
    generateLinkCodeMutation.isSuccess,
    generateLinkCodeMutation.isError,
    generateLinkCodeMutation.data,
    generateLinkCodeMutation.error,
    setState,
  ]);

  // Sync use link code mutation state
  useEffect(() => {
    if (useLinkCodeMutation.isPending) {
      setState((prev) => ({
        ...prev,
        isUsingCode: true,
        codeUsageError: null,
      }));
    } else if (useLinkCodeMutation.isSuccess) {
      setState((prev) => ({
        ...prev,
        isUsingCode: false,
      }));
    } else if (useLinkCodeMutation.isError) {
      setState((prev) => ({
        ...prev,
        codeUsageError: useLinkCodeMutation.error?.message || "Error",
        isUsingCode: false,
      }));
    }
  }, [
    useLinkCodeMutation.isPending,
    useLinkCodeMutation.isSuccess,
    useLinkCodeMutation.isError,
    useLinkCodeMutation.error,
    setState,
  ]);

  // Sync admin session mutation state
  useEffect(() => {
    if (startAdminSessionMutation.isSuccess) {
      const response = startAdminSessionMutation.data;
      if (response?.success && response.data) {
        setState((prev) => ({
          ...prev,
          currentAdminSession: response.data!,
          isAdminSessionActive: true,
        }));
      }
    }
  }, [
    startAdminSessionMutation.isSuccess,
    startAdminSessionMutation.data,
    setState,
  ]);
}
