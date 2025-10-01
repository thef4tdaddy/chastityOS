/**
 * Custom hook for Account Linking Demo state and logic
 */

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
  LinkCode,
  AdminRelationship,
  AdminPermissions,
  SecuritySettings,
  PrivacySettings,
} from "@/types/account-linking";

// Helper to create Timestamp from Date
const toTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Mock permissions
const mockPermissions: AdminPermissions = {
  viewSessions: true,
  viewEvents: true,
  viewTasks: true,
  viewSettings: true,
  controlSessions: true,
  manageTasks: true,
  editSettings: false,
  setGoals: false,
  emergencyUnlock: false,
  forceEnd: false,
  viewAuditLog: true,
  exportData: false,
};

// Mock security settings
const mockSecurity: SecuritySettings = {
  requireConfirmation: true,
  auditLog: true,
  sessionTimeout: 60,
  requireReauth: false,
  ipRestrictions: [],
};

// Mock privacy settings
const mockPrivacy: PrivacySettings = {
  wearerCanSeeAdminActions: true,
  keyholderCanSeePrivateNotes: false,
  shareStatistics: true,
  retainDataAfterDisconnect: true,
  anonymizeHistoricalData: false,
};

// Mock data for demonstration
const mockInviteCodes: LinkCode[] = [
  {
    id: "invite-1",
    wearerId: "demo-user-123",
    createdAt: toTimestamp(new Date(Date.now() - 1000 * 60 * 30)), // 30 minutes ago
    expiresAt: toTimestamp(new Date(Date.now() + 1000 * 60 * 60 * 23.5)), // 23.5 hours from now
    status: "pending",
    maxUses: 1,
    usedBy: null,
  },
  {
    id: "invite-2",
    wearerId: "demo-user-123",
    createdAt: toTimestamp(new Date(Date.now() - 1000 * 60 * 60 * 2)), // 2 hours ago
    expiresAt: toTimestamp(new Date(Date.now() + 1000 * 60 * 60 * 22)), // 22 hours from now
    status: "pending",
    maxUses: 1,
    usedBy: null,
  },
];

const mockActiveKeyholder: AdminRelationship = {
  id: "rel-1",
  keyholderId: "keyholder-456",
  wearerId: "demo-user-123",
  establishedAt: toTimestamp(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)), // 1 week ago
  status: "active",
  permissions: mockPermissions,
  security: mockSecurity,
  privacy: mockPrivacy,
  linkMethod: "code",
  lastAdminAccess: toTimestamp(new Date(Date.now() - 1000 * 60 * 60)), // 1 hour ago
};

type DemoScenario =
  | "submissive-no-keyholder"
  | "submissive-with-keyholder"
  | "keyholder-mode";

export const useAccountLinkingDemo = (scenario: DemoScenario) => {
  // UI State
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [showAcceptInvite, setShowAcceptInvite] = useState(false);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [keyholderNameInput, setKeyholderNameInput] = useState("");

  // Message state
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info",
  );

  // Generate mock data based on scenario
  const getMockData = () => {
    const activeKeyholder =
      scenario === "submissive-with-keyholder" ? mockActiveKeyholder : null;

    const activeInviteCodes =
      scenario === "submissive-no-keyholder" ||
      scenario === "submissive-with-keyholder"
        ? mockInviteCodes
        : [];

    const relationshipSummary = {
      totalAsSubmissive: scenario === "submissive-with-keyholder" ? 1 : 0,
      totalAsKeyholder: scenario === "keyholder-mode" ? 2 : 0,
    };

    const relationships =
      scenario === "keyholder-mode"
        ? {
            asSubmissive: [],
            asKeyholder: [
              {
                id: "rel-2",
                keyholderId: "demo-user-123",
                wearerId: "sub-1",
                establishedAt: toTimestamp(
                  new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
                ),
                status: "active" as const,
                permissions: mockActiveKeyholder.permissions,
                security: mockSecurity,
                privacy: mockPrivacy,
                linkMethod: "code" as const,
              } as AdminRelationship,
              {
                id: "rel-3",
                keyholderId: "demo-user-123",
                wearerId: "sub-2",
                establishedAt: toTimestamp(
                  new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
                ),
                status: "active" as const,
                permissions: mockActiveKeyholder.permissions,
                security: mockSecurity,
                privacy: mockPrivacy,
                linkMethod: "code" as const,
              } as AdminRelationship,
            ],
          }
        : { asSubmissive: [], asKeyholder: [] };

    return {
      activeKeyholder,
      activeInviteCodes,
      relationshipSummary,
      relationships,
    };
  };

  const mockData = getMockData();

  // Message handlers
  const showMessage = (
    text: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("info");
  };

  // Action handlers
  const handleCreateInvite = () => {
    showMessage("Demo: Invite code ABC123 created successfully!", "success");
    setShowCreateInvite(false);
  };

  const handleAcceptInvite = () => {
    if (inviteCodeInput === "ABC123") {
      showMessage("Demo: Successfully accepted invite code!", "success");
    } else {
      showMessage("Demo: Invalid invite code. Try 'ABC123'", "error");
    }
    setInviteCodeInput("");
    setKeyholderNameInput("");
    setShowAcceptInvite(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage(`Copied "${text}" to clipboard`, "success");
    } catch {
      showMessage("Failed to copy to clipboard", "error");
    }
  };

  return {
    // State
    showCreateInvite,
    setShowCreateInvite,
    showAcceptInvite,
    setShowAcceptInvite,
    showPermissions,
    setShowPermissions,
    inviteCodeInput,
    setInviteCodeInput,
    keyholderNameInput,
    setKeyholderNameInput,
    message,
    messageType,

    // Actions
    showMessage,
    clearMessage,
    handleCreateInvite,
    handleAcceptInvite,
    copyToClipboard,

    // Mock data
    ...mockData,
  };
};
