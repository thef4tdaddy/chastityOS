/**
 * Account Linking Hooks Index
 * Exports all account linking related hooks
 */

export {
  useAccountLinking,
  useLinkCodeValidation,
  useAdminAccess,
} from "./useAccountLinking";

export {
  useGenerateLinkCode,
  useRedeemLinkCode,
  useUpdateRelationship,
  useStartAdminSession,
} from "./useAccountLinkingMutations";

export { useAdminRelationshipsQuery } from "./useAccountLinkingQueries";

export { useAccountLinkingState } from "./useAccountLinkingState";
