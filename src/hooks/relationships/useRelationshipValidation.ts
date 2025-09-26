/**
 * React Hook for Relationship Form Validation
 * Handles validation logic for relationship forms and rules
 */
import { useState, useCallback } from "react";
import { useAuthState } from "@/contexts/AuthContext";
import { dataMigrationService } from "@/services/migration/DataMigrationService";
import { BaseHookState, BaseHookActions } from "./types";
import { withErrorHandling, createBaseActions } from "./utils";

interface RelationshipValidationState extends BaseHookState {
  needsMigration: boolean;
}

interface RelationshipValidationActions extends BaseHookActions {
  migrateSingleUserData: () => Promise<void>;
  checkMigrationStatus: () => Promise<void>;
  validateRequestForm: (formData: {
    email: string;
    role: "submissive" | "keyholder";
    message?: string;
  }) => { isValid: boolean; errors: string[] };
  validatePermissionsForm: (permissions: any) => {
    isValid: boolean;
    errors: string[];
  };
}

export function useRelationshipValidation(): RelationshipValidationState &
  RelationshipValidationActions {
  const { user } = useAuthState();
  const userId = user?.uid;

  const [state, setState] = useState<RelationshipValidationState>({
    needsMigration: false,
    isLoading: false,
    error: null,
  });

  const { clearError: clearErrorFn } = createBaseActions();

  const checkMigrationStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const needsMigration = await dataMigrationService.needsMigration(userId);
      setState((prev) => ({ ...prev, needsMigration }));
    } catch (error) {
      // Silent fail for migration check - using logger instead of console
      // logger.warn("Failed to check migration status", error);
    }
  }, [userId]);

  const migrateSingleUserData = useCallback(async () => {
    if (!userId) throw new Error("User not authenticated");

    return withErrorHandling(
      async () => {
        const result = await dataMigrationService.migrateSingleUserData(userId);
        if (!result.success) {
          throw new Error(result.errors.join(", "));
        }
        setState((prev) => ({ ...prev, needsMigration: false }));
      },
      "migrate single user data",
      setState,
    );
  }, [userId]);

  const validateRequestForm = useCallback(
    (formData: {
      email: string;
      role: "submissive" | "keyholder";
      message?: string;
    }) => {
      const errors: string[] = [];

      if (!formData.email.trim()) {
        errors.push("Email is required");
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.push("Email format is invalid");
      }

      if (!formData.role) {
        errors.push("Role is required");
      }

      if (formData.message && formData.message.length > 500) {
        errors.push("Message cannot exceed 500 characters");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [],
  );

  const validatePermissionsForm = useCallback((permissions: any) => {
    const errors: string[] = [];

    // Add specific validation rules for permissions
    if (typeof permissions !== "object" || permissions === null) {
      errors.push("Permissions must be an object");
    }

    // Add more specific validation as needed based on RelationshipPermissions type

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  const clearError = useCallback(() => {
    clearErrorFn(setState);
  }, [clearErrorFn]);

  return {
    ...state,
    migrateSingleUserData,
    checkMigrationStatus,
    validateRequestForm,
    validatePermissionsForm,
    clearError,
  };
}
