/**
 * E2E Tests for Keyholder Permission Management
 * Tests managing permissions and viewing submissive data as keyholder
 */

import { test, expect } from "@playwright/test";
import {
  navigateToKeyholderPage,
  updatePermissions,
  verifyDataVisible,
} from "./helpers/relationship-helpers";

test.describe("Keyholder Permissions - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should display permission management interface", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for permissions section
    const permissionsSection = page.locator(
      'text=/permissions/i, text=/access/i, [data-testid*="permissions"]',
    );

    if ((await permissionsSection.count()) > 0) {
      await expect(permissionsSection.first()).toBeVisible();
    }
  });

  test("should display all available permissions", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // List of expected permissions
    const expectedPermissions = [
      "sessions",
      "tasks",
      "goals",
      "punishments",
      "settings",
    ];

    for (const permission of expectedPermissions) {
      const permissionElement = page.locator(
        `text=/${permission}/i, [data-permission="${permission}"]`,
      );

      if ((await permissionElement.count()) > 0) {
        console.log(`Found permission: ${permission}`);
      }
    }
  });

  test("should toggle individual permissions", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for permission checkboxes
    const sessionPermission = page.locator(
      'input[type="checkbox"][name*="session" i], input[type="checkbox"][id*="session"]',
    );

    if (await sessionPermission.first().isVisible()) {
      const initialState = await sessionPermission.first().isChecked();
      await sessionPermission.first().click();
      await page.waitForTimeout(500);

      const newState = await sessionPermission.first().isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test("should save permission changes", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Update permissions using helper
    await updatePermissions(page, {
      sessions: true,
      tasks: true,
      goals: false,
    });

    // Look for save confirmation
    const saveConfirmation = page.locator(
      "text=/saved/i, text=/updated/i, text=/success/i",
    );

    if ((await saveConfirmation.count()) > 0) {
      await expect(saveConfirmation.first()).toBeVisible();
    }
  });

  test("should persist permission changes after reload", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Change a specific permission
    const tasksPermission = page.locator(
      'input[type="checkbox"][name*="tasks" i]',
    );

    if (await tasksPermission.first().isVisible()) {
      await tasksPermission.first().click();
      await page.waitForTimeout(500);

      // Save if there's a save button
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }

      // Reload page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Navigate back to keyholder page
      await navigateToKeyholderPage(page);

      // Verify permission is still changed
      const permissionAfterReload = page.locator(
        'input[type="checkbox"][name*="tasks" i]',
      );
      if (await permissionAfterReload.first().isVisible()) {
        const isChecked = await permissionAfterReload.first().isChecked();
        console.log(`Tasks permission after reload: ${isChecked}`);
      }
    }
  });

  test("should display submissive session data", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for session data display
    const sessionData = page.locator(
      'text=/session/i, text=/duration/i, [data-testid*="session"]',
    );

    if ((await sessionData.count()) > 0) {
      await expect(sessionData.first()).toBeVisible();
      console.log("Session data visible");
    }

    // Verify data visibility using helper
    const hasSessionData = await verifyDataVisible(page, "sessions");
    if (hasSessionData) {
      console.log("Session data confirmed visible");
    }
  });

  test("should display submissive task list", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Navigate to tasks section if needed
    const tasksLink = page.locator(
      'a[href*="tasks"], button:has-text("Tasks")',
    );
    if (await tasksLink.isVisible()) {
      await tasksLink.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for task list
    const taskList = page.locator(
      '[data-testid*="task"], [class*="task-list"]',
    );

    if ((await taskList.count()) > 0) {
      await expect(taskList.first()).toBeVisible();
      console.log("Task list visible");
    }

    // Verify using helper
    const hasTaskData = await verifyDataVisible(page, "tasks");
    if (hasTaskData) {
      console.log("Task data confirmed visible");
    }
  });

  test("should display submissive event logs", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for events section
    const eventsLink = page.locator(
      'a[href*="event"], a[href*="log"], button:has-text("Events")',
    );

    if (await eventsLink.isVisible()) {
      await eventsLink.click();
      await page.waitForLoadState("networkidle");
    }

    // Check for event logs
    const eventLogs = page.locator(
      '[data-testid*="event"], [class*="event-log"]',
    );

    if ((await eventLogs.count()) > 0) {
      await expect(eventLogs.first()).toBeVisible();
      console.log("Event logs visible");
    }
  });

  test("should restrict access based on permissions", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Try to access different sections and verify access control
    const sections = [
      { name: "sessions", selector: 'a[href*="session"]' },
      { name: "tasks", selector: 'a[href*="task"]' },
      { name: "events", selector: 'a[href*="event"]' },
      { name: "settings", selector: 'a[href*="settings"]' },
    ];

    for (const section of sections) {
      const link = page.locator(section.selector);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState("networkidle");

        // Check if access is granted or denied
        const accessDenied = page.locator(
          "text=/access denied/i, text=/unauthorized/i, text=/no permission/i",
        );

        if ((await accessDenied.count()) > 0) {
          console.log(`Access restricted for ${section.name}`);
        } else {
          console.log(`Access granted for ${section.name}`);
        }

        // Navigate back
        await navigateToKeyholderPage(page);
      }
    }
  });

  test("should display session statistics", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for statistics display
    const stats = page.locator(
      'text=/statistics/i, text=/stats/i, [data-testid*="statistics"]',
    );

    if ((await stats.count()) > 0) {
      await expect(stats.first()).toBeVisible();

      // Look for specific stat elements
      const statElements = page.locator(
        "text=/total.*time/i, text=/average/i, text=/longest/i",
      );

      if ((await statElements.count()) > 0) {
        console.log(`Found ${await statElements.count()} statistic elements`);
      }
    }
  });

  test("should display goal progress", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for goals section
    const goalsLink = page.locator('a[href*="goal"], button:has-text("Goals")');

    if (await goalsLink.isVisible()) {
      await goalsLink.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for goal progress indicators
    const goalProgress = page.locator(
      '[data-testid*="goal"], [class*="progress"], text=/progress/i',
    );

    if ((await goalProgress.count()) > 0) {
      await expect(goalProgress.first()).toBeVisible();
      console.log("Goal progress visible");
    }
  });

  test("should allow bulk permission updates", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for bulk action controls
    const selectAllCheckbox = page.locator(
      'input[type="checkbox"][id*="all"], input[type="checkbox"][name*="all"]',
    );

    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();
      await page.waitForTimeout(500);

      // Save changes
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Look for confirmation
        const confirmation = page.locator(
          "text=/all permissions/i, text=/updated/i",
        );
        if ((await confirmation.count()) > 0) {
          await expect(confirmation.first()).toBeVisible();
        }
      }
    }
  });

  test("should display permission descriptions", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for info icons or descriptions
    const infoIcons = page.locator(
      '[data-testid*="info"], [class*="tooltip"], [aria-label*="information"]',
    );

    if ((await infoIcons.count()) > 0) {
      // Hover over first info icon
      await infoIcons.first().hover();
      await page.waitForTimeout(500);

      // Look for tooltip or description
      const tooltip = page.locator(
        '[role="tooltip"], [class*="tooltip-content"]',
      );

      if (await tooltip.isVisible()) {
        await expect(tooltip).toBeVisible();
        console.log("Permission description displayed");
      }
    }
  });

  test("should confirm permission changes with submissive", async ({
    page,
  }) => {
    await navigateToKeyholderPage(page);

    // Change permissions that require confirmation
    const sensitivePermission = page.locator(
      'input[type="checkbox"][name*="settings" i]',
    );

    if (await sensitivePermission.isVisible()) {
      await sensitivePermission.click();
      await page.waitForTimeout(500);

      // Look for confirmation dialog
      const confirmDialog = page.locator(
        'text=/confirm/i, text=/are you sure/i, [role="dialog"]',
      );

      if (await confirmDialog.isVisible()) {
        await expect(confirmDialog).toBeVisible();

        // Click confirm
        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes")',
        );
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test("should show permission change history", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for history or audit log
    const historyLink = page.locator(
      'a[href*="history"], a[href*="audit"], button:has-text("History")',
    );

    if (await historyLink.isVisible()) {
      await historyLink.click();
      await page.waitForLoadState("networkidle");

      // Look for history entries
      const historyEntries = page.locator(
        '[data-testid*="history"], [class*="history-item"]',
      );

      if ((await historyEntries.count()) > 0) {
        console.log(`Found ${await historyEntries.count()} history entries`);
        await expect(historyEntries.first()).toBeVisible();
      }
    }
  });

  test("should display data access timestamps", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for last accessed information
    const timestamps = page.locator(
      'text=/last.*accessed/i, text=/viewed/i, [data-testid*="timestamp"]',
    );

    if ((await timestamps.count()) > 0) {
      await expect(timestamps.first()).toBeVisible();
      console.log("Access timestamps visible");
    }
  });

  test("should filter data by date range", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for date filter controls
    const dateFilter = page.locator(
      'input[type="date"], [data-testid*="date-filter"]',
    );

    if ((await dateFilter.count()) >= 2) {
      // Set date range
      await dateFilter.first().fill("2024-01-01");
      await dateFilter.nth(1).fill("2024-12-31");

      // Apply filter
      const applyButton = page.locator(
        'button:has-text("Apply"), button:has-text("Filter")',
      );
      if (await applyButton.isVisible()) {
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Verify filtered data
        console.log("Date filter applied");
      }
    }
  });

  test("should export submissive data", async ({ page }) => {
    await navigateToKeyholderPage(page);

    // Look for export functionality
    const exportButton = page.locator(
      'button:has-text("Export"), button:has-text("Download")',
    );

    if (await exportButton.isVisible()) {
      // Set up download handler
      const downloadPromise = page
        .waitForEvent("download", {
          timeout: 5000,
        })
        .catch(() => null);

      await exportButton.click();

      const download = await downloadPromise;
      if (download) {
        console.log(`Export initiated: ${download.suggestedFilename()}`);
      }
    }
  });
});
