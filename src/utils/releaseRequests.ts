/**
 * Release Request Utilities
 * Helper functions for release request status checks
 */
import type { DBReleaseRequest } from "@/types/database";

/**
 * Helper to check if a request is approved
 */
export const isRequestApproved = (
  request: DBReleaseRequest | null | undefined,
): boolean => {
  return request?.status === "approved";
};

/**
 * Helper to check if a request is denied
 */
export const isRequestDenied = (
  request: DBReleaseRequest | null | undefined,
): boolean => {
  return request?.status === "denied";
};

/**
 * Helper to check if a request is pending
 */
export const isRequestPending = (
  request: DBReleaseRequest | null | undefined,
): boolean => {
  return request?.status === "pending";
};
