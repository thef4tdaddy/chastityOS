/**
 * Hook for managing keyholder relationships
 * Provides UI state and actions for account linking
 */
import { useState, useEffect, useCallback } from "react";
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

export function useKeyholderRelationships(): KeyholderRelationshipState &
  KeyholderRelationshipActions {
  const [state, setState] = useState<KeyholderRelationshipState>(initialState);
  const { user } = useAuthState();

  // Load relationships
  const loadRelationships = useCallback(async () => {
    if (!user?.uid) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const relationships =
        await KeyholderRelationshipService.getUserRelationships(user.uid);
      const activeKeyholder =
        await KeyholderRelationshipService.getActiveKeyholder(user.uid);

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
  }, [user?.uid]);

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

  // Create invite code
  const createInviteCode = useCallback(
    async (expirationHours = 24): Promise<InviteCode | null> => {
      if (!user?.uid || !user.displayName) return null;

      setState((prev) => ({ ...prev, isCreatingInvite: true, message: "" }));

      try {
        const canCreate =
          await KeyholderRelationshipService.canCreateInviteCode(user.uid);
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
          user.uid,
          user.displayName,
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

        // Reload invite codes
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
    [user?.uid, user?.displayName, loadInviteCodes],
  );

  // Accept invite code
  const acceptInviteCode = useCallback(
    async (code: string, keyholderName?: string): Promise<boolean> => {
      if (!user?.uid) return false;

      setState((prev) => ({ ...prev, isAcceptingInvite: true, message: "" }));

      try {
        const _relationship =
          await KeyholderRelationshipService.acceptInviteCode(
            code,
            user.uid,
            keyholderName || user.displayName,
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

        // Reload relationships
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
    [user?.uid, user?.displayName, loadRelationships, loadRelationshipSummary],
  );

  // Revoke invite code
  const revokeInviteCode = useCallback(
    async (codeId: string) => {
      if (!user?.uid) return;

      try {
        await KeyholderRelationshipService.revokeInviteCode(codeId, user.uid);
        logger.info("Invite code revoked successfully", { codeId });
        await loadInviteCodes();
      } catch (error) {
        const _errorMessage =
          (error as Error).message || "Failed to revoke invite code";
        logger.error("Failed to revoke invite code", { error: error as Error });
      }
    },
    [user?.uid, loadInviteCodes],
  );

  // Update permissions
  const updatePermissions = useCallback(
    async (relationshipId: string, permissions: KeyholderPermissions) => {
      if (!user?.uid) return;

      setState((prev) => ({ ...prev, isUpdatingPermissions: true }));

      try {
        await KeyholderRelationshipService.updatePermissions(
          relationshipId,
          permissions,
          user.uid,
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
    [user?.uid, loadRelationships],
  );

  // End relationship
  const endRelationship = useCallback(
    async (relationshipId: string) => {
      if (!user?.uid) return;

      try {
        await KeyholderRelationshipService.endRelationship(
          relationshipId,
          user.uid,
        );
        logger.info("Relationship ended successfully");
        await loadRelationships();
        await loadRelationshipSummary();
      } catch (error) {
        const _errorMessage =
          (error as Error).message || "Failed to end relationship";
        logger.error("Failed to end relationship", { error: error as Error });
      }
    },
    [user?.uid, loadRelationships, loadRelationshipSummary],
  );

  // Form actions
  const setInviteCodeInput = useCallback((code: string) => {
    setState((prev) => ({ ...prev, inviteCodeInput: code.toUpperCase() }));
  }, []);

  const setKeyholderNameInput = useCallback((name: string) => {
    setState((prev) => ({ ...prev, keyholderNameInput: name }));
  }, []);

  const clearMessage = useCallback(() => {
    setState((prev) => ({ ...prev, message: "", messageType: "info" }));
  }, []);

  const clearForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      inviteCodeInput: "",
      keyholderNameInput: "",
      message: "",
      messageType: "info",
    }));
  }, []);

  // Utilities
  const validateInviteCode = useCallback((code: string): boolean => {
    return KeyholderRelationshipService.validateInviteCodeFormat(code);
  }, []);

  const canCreateInviteCode = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) return false;
    return await KeyholderRelationshipService.canCreateInviteCode(user.uid);
  }, [user?.uid]);

  const hasPermission = useCallback(
    async (
      submissiveUserId: string,
      permission: keyof KeyholderPermissions,
    ): Promise<boolean> => {
      if (!user?.uid) return false;
      return await KeyholderRelationshipService.hasPermission(
        user.uid,
        submissiveUserId,
        permission,
      );
    },
    [user?.uid],
  );

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
    revokeInviteCode,
    updatePermissions,
    endRelationship,
    setInviteCodeInput,
    setKeyholderNameInput,
    clearMessage,
    clearForm,
    validateInviteCode,
    canCreateInviteCode,
    hasPermission,
  };
}
