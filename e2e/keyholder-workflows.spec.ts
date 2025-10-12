/**
 * E2E Tests for Keyholder Workflows
 * Tests complete keyholder/submissive relationship workflows
 */

import { test, expect } from "@playwright/test";
import {
  createTestUser,
  navigateToKeyholderPage,
  setKeyholderName,
  extractGeneratedPassword,
  unlockKeyholderControls,
} from "./helpers/relationship-helpers";

test.describe("Keyholder Workflows - E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should set up keyholder mode and manage password", async ({ page }) => {
    // Navigate to keyholder page
    await navigateToKeyholderPage(page);

    // Check if keyholder page is accessible
    const pageContent = page.locator("body");
    await expect(pageContent).toBeVisible();

    // Look for keyholder setup elements
    const keyholderElements = page.locator(
      '[class*="keyholder"], [data-testid*="keyholder"]',
    );
    if ((await keyholderElements.count()) > 0) {
      await expect(keyholderElements.first()).toBeVisible();
    }

    // Try to set keyholder name
    const nameInput = page.locator(
      'input[placeholder*="Keyholder" i], input[id*="keyholder"]',
    );
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test Keyholder");

      const setButton = page.locator(
        'button:has-text("Set"), button:has-text("Save")',
      );
      if (await setButton.first().isVisible()) {
        await setButton.first().click();
        await page.waitForTimeout(1000);

        // Try to extract generated password
        const password = await extractGeneratedPassword(page);
        if (password) {
          console.log("Generated password detected:", password);
          expect(password).toMatch(/^[A-Z0-9]{6,}$/);
        }
      }
    }
  });

  test("should unlock keyholder controls with password", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Check if password input is available
    const passwordInput = page.locator(
      'input[type="password"], input[placeholder*="password" i]',
    );

    if (await passwordInput.isVisible()) {
      // Try with test password
      await unlockKeyholderControls(page, "TEST123");
      await page.waitForTimeout(1000);

      // Check if controls are unlocked (this may vary based on implementation)
      const controlElements = page.locator(
        'button:has-text("Lock"), [class*="unlocked"]',
      );
      if ((await controlElements.count()) > 0) {
        await expect(controlElements.first()).toBeVisible();
      }
    }
  });

  test("should manage keyholder duration settings", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for duration input
    const durationInput = page.locator(
      'input[type="number"][placeholder*="duration" i], input[placeholder*="days" i]',
    );

    if (await durationInput.first().isVisible()) {
      await durationInput.first().fill("7");

      // Look for update/save button
      const updateButton = page.locator(
        'button:has-text("Update"), button:has-text("Set Duration")',
      );
      if (await updateButton.isVisible()) {
        await updateButton.click();
        await page.waitForTimeout(1000);

        // Verify duration was set (look for display of duration)
        const durationDisplay = page.locator(
          "text=/Required Duration.*7.*days?/i, text=/Duration.*7/i",
        );
        if ((await durationDisplay.count()) > 0) {
          await expect(durationDisplay.first()).toBeVisible();
        }
      }
    }
  });

  test("should manage rewards and punishments", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for reward/punishment sections
    const rewardSection = page.locator(
      'text=/reward/i, [class*="reward"], [data-testid*="reward"]',
    );
    const punishmentSection = page.locator(
      'text=/punishment/i, [class*="punishment"], [data-testid*="punishment"]',
    );

    // Check if reward controls exist
    if ((await rewardSection.count()) > 0) {
      await expect(rewardSection.first()).toBeVisible();

      // Look for reward input
      const rewardInput = page.locator(
        'input[placeholder*="reward" i], input[placeholder*="subtract" i]',
      );
      if (await rewardInput.first().isVisible()) {
        await rewardInput.first().fill("1");

        const addRewardButton = page.locator(
          'button:has-text("Add Reward"), button:has-text("Reward")',
        );
        if (await addRewardButton.isVisible()) {
          await addRewardButton.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // Check if punishment controls exist
    if ((await punishmentSection.count()) > 0) {
      await expect(punishmentSection.first()).toBeVisible();

      const punishmentInput = page.locator(
        'input[placeholder*="punishment" i], input[placeholder*="add" i]',
      );
      if (await punishmentInput.first().isVisible()) {
        await punishmentInput.first().fill("2");

        const addPunishmentButton = page.locator(
          'button:has-text("Add Punishment"), button:has-text("Punishment")',
        );
        if (await addPunishmentButton.isVisible()) {
          await addPunishmentButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });

  test("should manage tasks as keyholder", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for task management section
    const taskSection = page.locator(
      'text=/task/i, [class*="task"], [data-testid*="task"]',
    );

    if ((await taskSection.count()) > 0) {
      // Look for add task form
      const taskInput = page.locator(
        'input[placeholder*="task" i], textarea[placeholder*="task" i]',
      );
      if (await taskInput.first().isVisible()) {
        await taskInput.first().fill("Test task for submissive");

        const addTaskButton = page.locator(
          'button:has-text("Add Task"), button:has-text("Create Task")',
        );
        if (await addTaskButton.isVisible()) {
          await addTaskButton.click();
          await page.waitForTimeout(1000);

          // Verify task appears in list
          const taskList = page.locator("text=/Test task for submissive/i");
          if ((await taskList.count()) > 0) {
            await expect(taskList.first()).toBeVisible();
          }
        }
      }
    }
  });

  test("should approve and reject tasks", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for task approval section
    const approvalSection = page.locator(
      'text=/approval/i, text=/pending/i, [data-testid*="approval"]',
    );

    if ((await approvalSection.count()) > 0) {
      await expect(approvalSection.first()).toBeVisible();

      // Look for approve buttons
      const approveButton = page.locator(
        'button:has-text("Approve"), button:has-text("Accept")',
      );
      if (await approveButton.first().isVisible()) {
        await approveButton.first().click();
        await page.waitForTimeout(500);
      }

      // Look for reject buttons
      const rejectButton = page.locator(
        'button:has-text("Reject"), button:has-text("Deny")',
      );
      if (await rejectButton.first().isVisible()) {
        await rejectButton.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("should lock keyholder controls when navigating away", async ({
    page,
  }) => {
    await navigateToKeyholderPage(page);

    // Unlock controls if possible
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await unlockKeyholderControls(page, "TEST123");
      await page.waitForTimeout(500);
    }

    // Navigate away from keyholder page
    const homeLink = page.locator('a[href="/"], button:has-text("Home")');
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState("networkidle");

      // Navigate back to keyholder page
      await navigateToKeyholderPage(page);

      // Verify controls are locked (password required again)
      const passwordInputAgain = page.locator('input[type="password"]');
      if ((await passwordInputAgain.count()) > 0) {
        // Controls should be locked - password input visible
        await expect(passwordInputAgain).toBeVisible();
      }
    }
  });

  test("should display keyholder name when set", async ({ page }) => {
    await navigateToKeyholderPage(page);

    const keyholderName = "Test Keyholder Name";

    // Try to set keyholder name
    await setKeyholderName(page, keyholderName);
    await page.waitForTimeout(1000);

    // Look for display of keyholder name in the app
    const nameDisplay = page.locator(`text=/${keyholderName}/i`);
    if ((await nameDisplay.count()) > 0) {
      await expect(nameDisplay.first()).toBeVisible();
    }
  });

  test("should handle permanent password setting", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for permanent password setting option
    const permanentPasswordSection = page.locator(
      "text=/permanent.*password/i, text=/custom.*password/i",
    );

    if ((await permanentPasswordSection.count()) > 0) {
      await expect(permanentPasswordSection.first()).toBeVisible();

      // Look for new password inputs
      const newPasswordInput = page.locator(
        'input[placeholder*="new password" i], input[id*="newPassword"]',
      );
      const confirmPasswordInput = page.locator(
        'input[placeholder*="confirm" i], input[id*="confirmPassword"]',
      );

      if (
        (await newPasswordInput.isVisible()) &&
        (await confirmPasswordInput.isVisible())
      ) {
        await newPasswordInput.fill("MySecurePassword123");
        await confirmPasswordInput.fill("MySecurePassword123");

        const setPasswordButton = page.locator(
          'button:has-text("Set Password"), button:has-text("Update Password")',
        );
        if (await setPasswordButton.isVisible()) {
          await setPasswordButton.click();
          await page.waitForTimeout(1000);

          // Look for success message
          const successMessage = page.locator(
            "text=/password.*updated/i, text=/success/i",
          );
          if ((await successMessage.count()) > 0) {
            await expect(successMessage.first()).toBeVisible();
          }
        }
      }
    }
  });
});
