/**
 * Hook for managing keyholder relationships
 * Provides UI state and actions for account linking
 */
import React, { useState, useEffect, useCallback } from "react";
import { useAuthState } from "../contexts";
import { KeyholderRelationshipService } from "../services/KeyholderRelationshipService";
import { KeyholderRelationship, KeyholderPermissions } from "../types/core";
import { InviteCode } from "../services/database/KeyholderRelationshipDBService";
import { serviceLogger } from "../utils/logging";

const logger = serviceLogger("useKeyholderRelationships");

export interface KeyholderRelationshipState {
  // Relationships
  relationships: {
    asSubmissive: KeyholderRelationship[];
    asKeyholder: KeyholderRelationship[];
  };
  activeKeyholder: KeyholderRelationship | null;

  // Invite codes
  activeInviteCodes: InviteCode[];

  // Loading states
  isLoading: boolean;
  isCreatingInvite: boolean;
  isAcceptingInvite: boolean;
  isUpdatingPermissions: boolean;

  // Form states
  inviteCodeInput: string;
  keyholderNameInput: string;

  // Messages
  message: string;
  messageType: "success" | "error" | "info";

  // Summary
  relationshipSummary: {
    hasActiveKeyholder: boolean;
    hasSubmissives: boolean;
    activeKeyholderCount: number;
    submissiveCount: number;
  } | null;
}

export interface KeyholderRelationshipActions {
  // Data loading
  loadRelationships: () => Promise<void>;
  loadInviteCodes: () => Promise<void>;
  loadRelationshipSummary: () => Promise<void>;

  // Invite code management
  createInviteCode: (expirationHours?: number) => Promise<InviteCode | null>;
  acceptInviteCode: (code: string, keyholderName?: string) => Promise<boolean>;
  revokeInviteCode: (codeId: string) => Promise<void>;

  // Relationship management
  updatePermissions: (
    relationshipId: string,
    permissions: KeyholderPermissions,
  ) => Promise<void>;
  endRelationship: (relationshipId: string) => Promise<void>;

  // Form actions
  setInviteCodeInput: (code: string) => void;
  setKeyholderNameInput: (name: string) => void;
  clearMessage: () => void;
  clearForm: () => void;

  // Utilities
  validateInviteCode: (code: string) => boolean;
  canCreateInviteCode: () => Promise<boolean>;
  hasPermission: (
    submissiveUserId: string,
    permission: keyof KeyholderPermissions,
  ) => Promise<boolean>;
}

const initialState: KeyholderRelationshipState = {
  relationships: {
    asSubmissive: [],
    asKeyholder: [],
  },
  activeKeyholder: null,
  activeInviteCodes: [],
  isLoading: false,
  isCreatingInvite: false,
  isAcceptingInvite: false,
  isUpdatingPermissions: false,
  inviteCodeInput: "",
  keyholderNameInput: "",
  message: "",
  messageType: "info",
  relationshipSummary: null,
};

/**
 * Hook to load relationships data
 */
function useLoadRelationships(
  userId: string | undefined,
  setState: React.Dispatch<React.SetStateAction<KeyholderRelationshipState>>,
) {
  return useCallback(async () => {
    if (!userId) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const relationships =
        await KeyholderRelationshipService.getUserRelationships(userId);
      const activeKeyholder =
        await KeyholderRelationshipService.getActiveKeyholder(userId);

      setState((prev) => ({
        ...prev,
        relationships,
        activeKeyholder,
        isLoading: false,
      }));

      logger.debug("Relationships loaded", {
        submissiveCount: relationships.asSubmissive.length,
        keyholderCount: relationships.asKeyholder.length,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        message: "Failed to load relationships",
        messageType: "error",
      }));
      logger.error("Failed to load relationships", { error: error as Error });
    }
  }, [userId, setState]);
}

/**
 * Hook to create invite codes
 */
function useCreateInviteCode(
  userId: string | undefined,
  displayName: string | undefined | null,
  setState: React.Dispatch<React.SetStateAction<KeyholderRelationshipState>>,
  loadInviteCodes: () => Promise<void>,
) {
  return useCallback(
    async (expirationHours = 24): Promise<InviteCode | null> => {
      if (!userId || !displayName) return null;

      setState((prev) => ({ ...prev, isCreatingInvite: true, message: "" }));

      try {
        const canCreate =
          await KeyholderRelationshipService.canCreateInviteCode(userId);
        if (!canCreate) {
          setState((prev) => ({
            ...prev,
            isCreatingInvite: false,
            message: "You already have an active keyholder relationship",
            messageType: "error",
          }));
          return null;
        }

        const inviteCode = await KeyholderRelationshipService.createInviteCode(
          userId,
          displayName,
          expirationHours,
        );

        setState((prev) => ({
          ...prev,
          isCreatingInvite: false,
          message: `Invite code created: ${inviteCode.code}`,
          messageType: "success",
        }));

        logger.info("Invite code created successfully", {
          code: inviteCode.code,
        });

        await loadInviteCodes();
        return inviteCode;
      } catch (error) {
        const errorMessage =
          (error as Error).message || "Failed to create invite code";
        setState((prev) => ({
          ...prev,
          isCreatingInvite: false,
          message: errorMessage,
          messageType: "error",
        }));
        logger.error("Failed to create invite code", { error: error as Error });
        return null;
      }
    },
    [userId, displayName, setState, loadInviteCodes],
  );
}

/**
 * Hook to accept invite codes
 */
function useAcceptInviteCode(
  userId: string | undefined,
  displayName: string | undefined | null,
  setState: React.Dispatch<React.SetStateAction<KeyholderRelationshipState>>,
  loadRelationships: () => Promise<void>,
  loadRelationshipSummary: () => Promise<void>,
) {
  return useCallback(
    async (code: string, keyholderName?: string): Promise<boolean> => {
      if (!userId) return false;

      setState((prev) => ({ ...prev, isAcceptingInvite: true, message: "" }));

      try {
        await KeyholderRelationshipService.acceptInviteCode(
          code,
          userId,
          keyholderName || displayName,
        );

        setState((prev) => ({
          ...prev,
          isAcceptingInvite: false,
          message: "Successfully linked with submissive!",
          messageType: "success",
          inviteCodeInput: "",
          keyholderNameInput: "",
        }));

        logger.info("Invite code accepted successfully");

        await loadRelationships();
        await loadRelationshipSummary();

        return true;
      } catch (error) {
        const errorMessage =
          (error as Error).message || "Failed to accept invite code";
        setState((prev) => ({
          ...prev,
          isAcceptingInvite: false,
          message: errorMessage,
          messageType: "error",
        }));
        logger.error("Failed to accept invite code", { error: error as Error });
        return false;
      }
    },
    [userId, displayName, setState, loadRelationships, loadRelationshipSummary],
  );
}

/**
 * Hook composition for relationship actions
 */
function useRelationshipActions(
  userId: string | undefined,
  setState: React.Dispatch<React.SetStateAction<KeyholderRelationshipState>>,
  loadRelationships: () => Promise<void>,
  loadRelationshipSummary: () => Promise<void>,
  loadInviteCodes: () => Promise<void>,
) {
  const revokeInviteCode = useCallback(
    async (codeId: string) => {
      if (!userId) return;

      try {
        await KeyholderRelationshipService.revokeInviteCode(codeId, userId);
        logger.info("Invite code revoked successfully", { codeId });
        await loadInviteCodes();
      } catch (error) {
        logger.error("Failed to revoke invite code", { error: error as Error });
      }
    },
    [userId, loadInviteCodes],
  );

  const updatePermissions = useCallback(
    async (relationshipId: string, permissions: KeyholderPermissions) => {
      if (!userId) return;

      setState((prev) => ({ ...prev, isUpdatingPermissions: true }));

      try {
        await KeyholderRelationshipService.updatePermissions(
          relationshipId,
          permissions,
          userId,
        );
        setState((prev) => ({
          ...prev,
          isUpdatingPermissions: false,
          message: "Permissions updated successfully",
          messageType: "success",
        }));
        logger.info("Permissions updated successfully");
        await loadRelationships();
      } catch (error) {
        const errorMessage =
          (error as Error).message || "Failed to update permissions";
        setState((prev) => ({
          ...prev,
          isUpdatingPermissions: false,
          message: errorMessage,
          messageType: "error",
        }));
        logger.error("Failed to update permissions", { error: error as Error });
      }
    },
    [userId, setState, loadRelationships],
  );

  const endRelationship = useCallback(
    async (relationshipId: string) => {
      if (!userId) return;

      try {
        await KeyholderRelationshipService.endRelationship(
          relationshipId,
          userId,
        );
        logger.info("Relationship ended successfully");
        await loadRelationships();
        await loadRelationshipSummary();
      } catch (error) {
        logger.error("Failed to end relationship", { error: error as Error });
      }
    },
    [userId, loadRelationships, loadRelationshipSummary],
  );

  return { revokeInviteCode, updatePermissions, endRelationship };
}

/**
 * Hook composition for form actions
 */
function useFormActions(
  setState: React.Dispatch<React.SetStateAction<KeyholderRelationshipState>>,
) {
  const setInviteCodeInput = useCallback(
    (code: string) => {
      setState((prev) => ({ ...prev, inviteCodeInput: code.toUpperCase() }));
    },
    [setState],
  );

  const setKeyholderNameInput = useCallback(
    (name: string) => {
      setState((prev) => ({ ...prev, keyholderNameInput: name }));
    },
    [setState],
  );

  const clearMessage = useCallback(() => {
    setState((prev) => ({ ...prev, message: "", messageType: "info" }));
  }, [setState]);

  const clearForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      inviteCodeInput: "",
      keyholderNameInput: "",
      message: "",
      messageType: "info",
    }));
  }, [setState]);

  return { setInviteCodeInput, setKeyholderNameInput, clearMessage, clearForm };
}

/**
 * Hook composition for utility functions
 */
function useRelationshipUtils(userId: string | undefined) {
  const validateInviteCode = useCallback((code: string): boolean => {
    return KeyholderRelationshipService.validateInviteCodeFormat(code);
  }, []);

  const canCreateInviteCode = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    return await KeyholderRelationshipService.canCreateInviteCode(userId);
  }, [userId]);

  const hasPermission = useCallback(
    async (
      submissiveUserId: string,
      permission: keyof KeyholderPermissions,
    ): Promise<boolean> => {
      if (!userId) return false;
      return await KeyholderRelationshipService.hasPermission(
        userId,
        submissiveUserId,
        permission,
      );
    },
    [userId],
  );

  return { validateInviteCode, canCreateInviteCode, hasPermission };
}

export function useKeyholderRelationships(): KeyholderRelationshipState &
  KeyholderRelationshipActions {
  const [state, setState] = useState<KeyholderRelationshipState>(initialState);
  const { user } = useAuthState();

  // Load invite codes
  const loadInviteCodes = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const activeInviteCodes =
        await KeyholderRelationshipService.getActiveInviteCodes(user.uid);
      setState((prev) => ({ ...prev, activeInviteCodes }));
    } catch (error) {
      logger.error("Failed to load invite codes", { error: error as Error });
    }
  }, [user?.uid]);

  // Load relationship summary
  const loadRelationshipSummary = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const relationshipSummary =
        await KeyholderRelationshipService.getRelationshipSummary(user.uid);
      setState((prev) => ({ ...prev, relationshipSummary }));
    } catch (error) {
      logger.error("Failed to load relationship summary", {
        error: error as Error,
      });
    }
  }, [user?.uid]);

  const loadRelationships = useLoadRelationships(user?.uid, setState);
  const createInviteCode = useCreateInviteCode(
    user?.uid,
    user?.displayName,
    setState,
    loadInviteCodes,
  );
  const acceptInviteCode = useAcceptInviteCode(
    user?.uid,
    user?.displayName,
    setState,
    loadRelationships,
    loadRelationshipSummary,
  );

  const relationshipActions = useRelationshipActions(
    user?.uid,
    setState,
    loadRelationships,
    loadRelationshipSummary,
    loadInviteCodes,
  );

  const formActions = useFormActions(setState);
  const utils = useRelationshipUtils(user?.uid);

  // Load data on mount and user change
  useEffect(() => {
    if (user?.uid) {
      loadRelationships();
      loadInviteCodes();
      loadRelationshipSummary();
    } else {
      setState(initialState);
    }
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [user?.uid, loadRelationships, loadInviteCodes, loadRelationshipSummary]);

  return {
    ...state,
    loadRelationships,
    loadInviteCodes,
    loadRelationshipSummary,
    createInviteCode,
    acceptInviteCode,
    ...relationshipActions,
    ...formActions,
    ...utils,
  };
}
