/**
 * Relationship Test Helpers
 * Utilities for testing keyholder/submissive relationship workflows
 */

import { Page } from "@playwright/test";
import type {
  Relationship,
  RelationshipRequest,
  RelationshipPermissions,
} from "../../src/types/relationships";
import type { LinkCode } from "../../src/types/account-linking";

/**
 * Mock user data for testing
 */
export interface TestUser {
  uid: string;
  email: string;
  displayName: string;
  role: "submissive" | "keyholder" | "both";
}

export const createTestUser = (
  role: "submissive" | "keyholder" | "both",
  index = 1,
): TestUser => ({
  uid: `test-${role}-${index}-uid`,
  email: `test-${role}-${index}@example.com`,
  displayName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${index}`,
  role,
});

/**
 * Default relationship permissions for testing
 */
export const createDefaultPermissions = (): RelationshipPermissions => ({
  keyholderCanEdit: {
    sessions: true,
    tasks: true,
    goals: true,
    punishments: true,
    settings: false,
  },
  submissiveCanPause: true,
  emergencyUnlock: true,
  requireApproval: {
    sessionEnd: false,
    taskCompletion: true,
    goalChanges: true,
  },
});

/**
 * Create a mock relationship for testing
 */
export const createMockRelationship = (
  submissiveId: string,
  keyholderId: string,
  overrides?: Partial<Relationship>,
): Partial<Relationship> => ({
  id: `${keyholderId}_${submissiveId}`,
  submissiveId,
  keyholderId,
  status: "active" as const,
  permissions: createDefaultPermissions(),
  ...overrides,
});

/**
 * Create a mock relationship request
 */
export const createMockRelationshipRequest = (
  fromUserId: string,
  toUserId: string,
  fromRole: "submissive" | "keyholder",
): Partial<RelationshipRequest> => ({
  id: `req_${fromUserId}_${toUserId}`,
  fromUserId,
  toUserId,
  fromRole,
  toRole: fromRole === "submissive" ? "keyholder" : "submissive",
  status: "pending" as const,
  message: "Would you like to be my keyholder?",
});

/**
 * Create a mock link code for account linking
 */
export const createMockLinkCode = (wearerId: string): Partial<LinkCode> => ({
  id: `link_${wearerId}_${Date.now()}`,
  wearerId,
  status: "pending" as const,
  maxUses: 1,
  usedBy: null,
});

/**
 * Helper to mock Firebase authentication in the browser
 */
export const mockFirebaseAuth = async (page: Page, user: TestUser) => {
  await page.evaluate((userData) => {
    // Mock Firebase auth object
    window.__testFirebaseAuth = {
      currentUser: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
      },
    };
  }, user);
};

/**
 * Helper to mock Firestore data in the browser
 */
export const mockFirestoreData = async (
  page: Page,
  collection: string,
  docId: string,
  data: unknown,
) => {
  await page.evaluate(
    ({ collection, docId, data }) => {
      if (!window.__testFirestoreData) {
        window.__testFirestoreData = {};
      }
      if (!window.__testFirestoreData[collection]) {
        window.__testFirestoreData[collection] = {};
      }
      window.__testFirestoreData[collection][docId] = data;
    },
    { collection, docId, data },
  );
};

/**
 * Helper to navigate to keyholder page
 */
export const navigateToKeyholderPage = async (page: Page) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Look for navigation to keyholder page
  const keyholderLink = page.locator(
    'a[href*="keyholder"], button:has-text("Keyholder")',
  );
  if (await keyholderLink.isVisible()) {
    await keyholderLink.click();
    await page.waitForLoadState("networkidle");
  }
};

/**
 * Helper to unlock keyholder controls with password
 */
export const unlockKeyholderControls = async (page: Page, password: string) => {
  // Look for password input
  const passwordInput = page.locator(
    'input[type="password"], input[placeholder*="password" i]',
  );
  if (await passwordInput.isVisible()) {
    await passwordInput.fill(password);

    // Look for unlock button
    const unlockButton = page.locator(
      'button:has-text("Unlock"), button:has-text("Submit")',
    );
    await unlockButton.click();
    await page.waitForTimeout(1000); // Wait for unlock to process
  }
};

/**
 * Helper to set keyholder name
 */
export const setKeyholderName = async (page: Page, name: string) => {
  const nameInput = page.locator(
    'input[placeholder*="Keyholder" i], input[id*="keyholder"]',
  );
  if (await nameInput.isVisible()) {
    await nameInput.fill(name);

    const setButton = page.locator(
      'button:has-text("Set"), button:has-text("Save")',
    );
    await setButton.first().click();
    await page.waitForTimeout(500);
  }
};

/**
 * Helper to wait for and extract generated password
 */
export const extractGeneratedPassword = async (
  page: Page,
): Promise<string | null> => {
  // Wait for password display modal or message
  await page.waitForTimeout(1000);

  // Try to find password in various locations
  const passwordSelectors = [
    "text=/Your keyholder password is: ([A-Z0-9]+)/",
    '[class*="password"], [data-testid="password"]',
    "code, pre",
  ];

  for (const selector of passwordSelectors) {
    const element = page.locator(selector);
    if (await element.isVisible()) {
      const text = await element.textContent();
      if (text) {
        // Extract password from text (typically uppercase alphanumeric)
        const match = text.match(/[A-Z0-9]{6,}/);
        if (match) {
          return match[0];
        }
      }
    }
  }

  return null;
};

/**
 * Helper to create a relationship invitation
 */
export const sendRelationshipInvitation = async (
  page: Page,
  recipientEmail: string,
) => {
  // Look for invitation/request form
  const emailInput = page.locator(
    'input[type="email"], input[placeholder*="email" i]',
  );
  if (await emailInput.isVisible()) {
    await emailInput.fill(recipientEmail);

    const sendButton = page.locator(
      'button:has-text("Send"), button:has-text("Invite")',
    );
    await sendButton.click();
    await page.waitForTimeout(1000);
  }
};

/**
 * Helper to check if relationship is active
 */
export const isRelationshipActive = async (page: Page): Promise<boolean> => {
  // Look for indicators of active relationship
  const activeIndicators = [
    "text=/Active.*Relationship/i",
    '[data-status="active"]',
    "text=/Connected/i",
  ];

  for (const selector of activeIndicators) {
    const element = page.locator(selector);
    if ((await element.count()) > 0 && (await element.first().isVisible())) {
      return true;
    }
  }

  return false;
};

/**
 * Helper to manage permissions
 */
export const updatePermissions = async (
  page: Page,
  permissions: Partial<Record<string, boolean>>,
) => {
  for (const [permission, enabled] of Object.entries(permissions)) {
    const checkbox = page.locator(
      `input[type="checkbox"][name*="${permission}" i], input[type="checkbox"][id*="${permission}" i]`,
    );
    if (await checkbox.isVisible()) {
      const isChecked = await checkbox.isChecked();
      if (isChecked !== enabled) {
        await checkbox.click();
      }
    }
  }

  // Save permissions
  const saveButton = page.locator(
    'button:has-text("Save"), button:has-text("Update")',
  );
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await page.waitForTimeout(500);
  }
};

/**
 * Helper to verify data visibility
 */
export const verifyDataVisible = async (
  page: Page,
  dataType: "sessions" | "tasks" | "events",
): Promise<boolean> => {
  const selectors = {
    sessions: '[data-testid="session"], [class*="session"]',
    tasks: '[data-testid="task"], [class*="task"]',
    events: '[data-testid="event"], [class*="event"]',
  };

  const element = page.locator(selectors[dataType]);
  const count = await element.count();
  return count > 0;
};

/**
 * Helper to decline or cancel a relationship
 */
export const declineRelationship = async (page: Page) => {
  const declineButton = page.locator(
    'button:has-text("Decline"), button:has-text("Reject"), button:has-text("Cancel")',
  );
  if (await declineButton.isVisible()) {
    await declineButton.click();

    // Confirm if there's a confirmation dialog
    await page.waitForTimeout(500);
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Yes")',
    );
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    await page.waitForTimeout(1000);
  }
};

/**
 * Helper to end/terminate a relationship
 */
export const endRelationship = async (page: Page) => {
  const endButton = page.locator(
    'button:has-text("End"), button:has-text("Terminate"), button:has-text("Disconnect")',
  );
  if (await endButton.isVisible()) {
    await endButton.click();

    // Confirm if there's a confirmation dialog
    await page.waitForTimeout(500);
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Yes")',
    );
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    await page.waitForTimeout(1000);
  }
};

// Type augmentation for test globals
declare global {
  interface Window {
    __testFirebaseAuth?: {
      currentUser: {
        uid: string;
        email: string;
        displayName: string;
      };
    };
    __testFirestoreData?: Record<string, Record<string, unknown>>;
  }
}
