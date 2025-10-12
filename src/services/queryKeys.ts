/**
 * Query Key Factory for TanStack Query
 * Centralized query keys for consistent cache management
 */

export const queryKeys = {
  // Keyholder Relationships
  keyholderRelationships: {
    all: ["keyholderRelationships"] as const,
    list: (userId: string) =>
      [...queryKeys.keyholderRelationships.all, "list", userId] as const,
    detail: (relationshipId: string) =>
      [
        ...queryKeys.keyholderRelationships.all,
        "detail",
        relationshipId,
      ] as const,
    inviteCodes: (userId: string) =>
      [...queryKeys.keyholderRelationships.all, "inviteCodes", userId] as const,
    activeKeyholder: (userId: string) =>
      [
        ...queryKeys.keyholderRelationships.all,
        "activeKeyholder",
        userId,
      ] as const,
    summary: (userId: string) =>
      [...queryKeys.keyholderRelationships.all, "summary", userId] as const,
    permissions: (keyholderUserId: string, submissiveUserId: string) =>
      [
        ...queryKeys.keyholderRelationships.all,
        "permissions",
        keyholderUserId,
        submissiveUserId,
      ] as const,
  },

  // Relationships (dual-account system)
  relationships: {
    all: ["relationships"] as const,
    list: (userId: string) =>
      [...queryKeys.relationships.all, "list", userId] as const,
    detail: (relationshipId: string) =>
      [...queryKeys.relationships.all, "detail", relationshipId] as const,
    chastityData: (relationshipId: string) =>
      [...queryKeys.relationships.all, "chastityData", relationshipId] as const,
    tasks: (relationshipId: string) =>
      [...queryKeys.relationships.all, "tasks", relationshipId] as const,
    events: (relationshipId: string) =>
      [...queryKeys.relationships.all, "events", relationshipId] as const,
    sessions: (relationshipId: string) =>
      [...queryKeys.relationships.all, "sessions", relationshipId] as const,
    pendingRequests: (userId: string) =>
      [...queryKeys.relationships.all, "pendingRequests", userId] as const,
  },

  // Account Linking
  accountLinking: {
    all: ["accountLinking"] as const,
    adminRelationships: (userId: string) =>
      [...queryKeys.accountLinking.all, "adminRelationships", userId] as const,
    linkCodeValidation: (code: string) =>
      [...queryKeys.accountLinking.all, "linkCodeValidation", code] as const,
    adminSession: (relationshipId: string) =>
      [
        ...queryKeys.accountLinking.all,
        "adminSession",
        relationshipId,
      ] as const,
  },
} as const;
