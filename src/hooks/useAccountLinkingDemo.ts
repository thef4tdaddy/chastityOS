/**
 * Custom hook for Account Linking Demo state and logic
 */

import { useState } from "react";

// Mock data for demonstration
const mockInviteCodes = [
  {
    id: "invite-1",
    code: "ABC123",
    submissiveUserId: "demo-user-123",
    submissiveName: "Demo User",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 23.5), // 23.5 hours from now
    isUsed: false,
  },
  {
    id: "invite-2",
    code: "XYZ789",
    submissiveUserId: "demo-user-123",
    submissiveName: "Demo User",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22), // 22 hours from now
    isUsed: false,
  },
];

const mockActiveKeyholder = {
  id: "rel-1",
  submissiveUserId: "demo-user-123",
  keyholderUserId: "keyholder-456",
  status: "active" as const,
  permissions: {
    canLockSessions: true,
    canUnlockSessions: false,
    canCreateTasks: true,
    canApproveTasks: true,
    canViewFullHistory: true,
    canEditGoals: false,
  },
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
  acceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
};

type DemoScenario = "submissive-no-keyholder" | "submissive-with-keyholder" | "keyholder-mode";

export const useAccountLinkingDemo = (scenario: DemoScenario) => {
  // UI State
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [showAcceptInvite, setShowAcceptInvite] = useState(false);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [keyholderNameInput, setKeyholderNameInput] = useState("");

  // Message state
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  // Generate mock data based on scenario
  const getMockData = () => {
    const activeKeyholder = 
      scenario === "submissive-with-keyholder" ? mockActiveKeyholder : null;
    
    const activeInviteCodes = 
      scenario === "submissive-no-keyholder" || scenario === "submissive-with-keyholder" 
        ? mockInviteCodes 
        : [];
    
    const relationshipSummary = {
      totalAsSubmissive: scenario === "submissive-with-keyholder" ? 1 : 0,
      totalAsKeyholder: scenario === "keyholder-mode" ? 2 : 0,
    };

    const relationships = scenario === "keyholder-mode"
      ? {
          asSubmissive: [],
          asKeyholder: [
            {
              id: "rel-2",
              submissiveUserId: "sub-1",
              keyholderUserId: "demo-user-123",
              status: "active" as const,
              permissions: mockActiveKeyholder.permissions,
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
              acceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            },
            {
              id: "rel-3",
              submissiveUserId: "sub-2",
              keyholderUserId: "demo-user-123",
              status: "active" as const,
              permissions: mockActiveKeyholder.permissions,
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
              acceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
            },
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
  const showMessage = (text: string, type: "success" | "error" | "info" = "info") => {
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
    } catch (err) {
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