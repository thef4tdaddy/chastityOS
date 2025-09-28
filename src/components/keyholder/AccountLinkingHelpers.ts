// Helper functions for AccountLinking component state evaluation

interface RelationshipData {
  asKeyholder?: unknown[];
}

interface AccountLinkingStateResult {
  hasError: boolean;
  hasSuccess: boolean;
  hasActiveKeyholder: boolean;
  hasActiveInvites: boolean;
  hasSubmissives: boolean;
  showCreateInvite: boolean;
}

export const getAccountLinkingState = (
  relationships: RelationshipData,
  activeKeyholder: unknown,
  activeInviteCodes: unknown[],
  message: string,
  messageType: string,
): AccountLinkingStateResult => {
  return {
    hasError: messageType === "error" && !!message,
    hasSuccess: messageType === "success" && !!message,
    hasActiveKeyholder: !!activeKeyholder,
    hasActiveInvites: activeInviteCodes.length > 0,
    hasSubmissives: (relationships?.asKeyholder?.length || 0) > 0,
    showCreateInvite: !activeKeyholder,
  };
};

export const shouldShowLinkingForm = (
  authState: unknown,
  linkingState: AccountLinkingStateResult,
): boolean => {
  return !linkingState.hasActiveKeyholder && !linkingState.hasError;
};

export const shouldShowSuccessMessage = (
  linkingState: AccountLinkingStateResult,
): boolean => {
  return linkingState.hasSuccess;
};

export const shouldShowErrorMessage = (
  linkingState: AccountLinkingStateResult,
): boolean => {
  return linkingState.hasError;
};
