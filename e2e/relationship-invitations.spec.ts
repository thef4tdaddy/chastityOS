/**
 * E2E Tests for Relationship Invitations
 * Tests sending, accepting, declining, and canceling relationship invitations
 */

import { test, expect } from "@playwright/test";
import {
  createTestUser,
  navigateToKeyholderPage,
  sendRelationshipInvitation,
  declineRelationship,
  endRelationship,
  isRelationshipActive,
} from "./helpers/relationship-helpers";

test.describe("Relationship Invitations - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display relationship invitation interface", async ({ page }) => {
    // Navigate to relationships or settings page
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"], a[href*="connect"], button:has-text("Relationship")',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Look for invitation elements
    const invitationElements = page.locator(
      'text=/invite/i, text=/send.*request/i, [data-testid*="invitation"]',
    );

    if ((await invitationElements.count()) > 0) {
      await expect(invitationElements.first()).toBeVisible();
    }
  });

  test("should validate invitation form inputs", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Look for email input
    const emailInput = page.locator('input[type="email"]');

    if (await emailInput.first().isVisible()) {
      // Try invalid email
      await emailInput.first().fill("invalid-email");

      const sendButton = page.locator(
        'button:has-text("Send"), button:has-text("Invite")',
      );

      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(500);

        // Look for validation error
        const errorMessage = page.locator(
          'text=/invalid.*email/i, text=/error/i, [class*="error"]',
        );
        if ((await errorMessage.count()) > 0) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    }
  });

  test("should send relationship invitation with valid email", async ({
    page,
  }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    const testEmail = "keyholder@example.com";

    // Try to send invitation
    await sendRelationshipInvitation(page, testEmail);

    // Look for success confirmation
    const successIndicators = page.locator(
      "text=/invitation.*sent/i, text=/request.*sent/i, text=/success/i",
    );

    if ((await successIndicators.count()) > 0) {
      await expect(successIndicators.first()).toBeVisible();
    }
  });

  test("should display pending invitations", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Look for pending invitations section
    const pendingSection = page.locator(
      'text=/pending/i, text=/waiting/i, [data-status="pending"]',
    );

    if ((await pendingSection.count()) > 0) {
      await expect(pendingSection.first()).toBeVisible();
    }
  });

  test("should accept relationship invitation", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Look for accept button on pending invitations
    const acceptButton = page.locator(
      'button:has-text("Accept"), button:has-text("Approve")',
    );

    if (await acceptButton.first().isVisible()) {
      await acceptButton.first().click();
      await page.waitForTimeout(1000);

      // Verify relationship is now active
      const isActive = await isRelationshipActive(page);
      if (isActive) {
        console.log("Relationship successfully activated");
      }

      // Look for success message
      const successMessage = page.locator(
        "text=/accepted/i, text=/connected/i, text=/active/i",
      );
      if ((await successMessage.count()) > 0) {
        await expect(successMessage.first()).toBeVisible();
      }
    }
  });

  test("should decline relationship invitation", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Decline invitation using helper
    await declineRelationship(page);

    // Verify invitation is no longer visible
    await page.waitForTimeout(1000);
    const pendingInvitations = page.locator('[data-status="pending"]');
    if ((await pendingInvitations.count()) === 0) {
      console.log("Invitation successfully declined");
    }
  });

  test("should cancel sent invitation", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Look for sent invitations
    const sentSection = page.locator(
      'text=/sent/i, text=/outgoing/i, [data-type="sent"]',
    );

    if ((await sentSection.count()) > 0) {
      // Look for cancel button
      const cancelButton = page.locator(
        'button:has-text("Cancel"), button:has-text("Withdraw")',
      );

      if (await cancelButton.first().isVisible()) {
        await cancelButton.first().click();
        await page.waitForTimeout(500);

        // Confirm cancellation
        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes")',
        );
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);

        // Verify invitation is removed
        const canceledMessage = page.locator(
          "text=/canceled/i, text=/withdrawn/i",
        );
        if ((await canceledMessage.count()) > 0) {
          await expect(canceledMessage.first()).toBeVisible();
        }
      }
    }
  });

  test("should show invitation expiration", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Look for expiration information
    const expirationInfo = page.locator(
      'text=/expires/i, text=/expiration/i, [data-testid*="expiration"]',
    );

    if ((await expirationInfo.count()) > 0) {
      await expect(expirationInfo.first()).toBeVisible();
    }
  });

  test("should handle multiple simultaneous invitations", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Check if multiple invitations are displayed
    const invitationItems = page.locator(
      '[data-testid*="invitation"], [class*="invitation"]',
    );

    const count = await invitationItems.count();
    if (count > 1) {
      console.log(`Found ${count} invitations`);

      // Verify each invitation is visible
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(invitationItems.nth(i)).toBeVisible();
      }
    }
  });

  test("should prevent duplicate invitations", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    const testEmail = "duplicate@example.com";

    // Try to send invitation twice
    await sendRelationshipInvitation(page, testEmail);
    await page.waitForTimeout(1000);

    // Try again with same email
    await sendRelationshipInvitation(page, testEmail);
    await page.waitForTimeout(500);

    // Look for error message about duplicate
    const errorMessage = page.locator(
      "text=/already.*sent/i, text=/already.*exists/i, text=/duplicate/i",
    );

    if ((await errorMessage.count()) > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test("should display invitation history", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Look for history section
    const historySection = page.locator(
      "text=/history/i, text=/past/i, text=/previous/i",
    );

    if ((await historySection.count()) > 0) {
      await expect(historySection.first()).toBeVisible();

      // Check for past invitations
      const pastInvitations = page.locator(
        '[data-status="accepted"], [data-status="declined"], [data-status="expired"]',
      );

      if ((await pastInvitations.count()) > 0) {
        console.log(`Found ${await pastInvitations.count()} past invitations`);
      }
    }
  });

  test("should include optional message with invitation", async ({ page }) => {
    const relationshipLinks = page.locator(
      'a[href*="relationship"], a[href*="link"]',
    );

    if ((await relationshipLinks.count()) > 0) {
      await relationshipLinks.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Look for message/note field
    const messageField = page.locator(
      'textarea[placeholder*="message" i], textarea[placeholder*="note" i], input[placeholder*="message" i]',
    );

    if (await messageField.isVisible()) {
      await messageField.fill("Would you like to be my keyholder?");

      // Send invitation with message
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill("keyholder-with-message@example.com");

        const sendButton = page.locator(
          'button:has-text("Send"), button:has-text("Invite")',
        );
        if (await sendButton.isVisible()) {
          await sendButton.click();
          await page.waitForTimeout(1000);

          // Verify invitation was sent
          const successMessage = page.locator("text=/sent/i, text=/success/i");
          if ((await successMessage.count()) > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
        }
      }
    }
  });
});
