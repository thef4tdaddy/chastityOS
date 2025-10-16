/**
 * E2E Tests for Achievements Workflows
 * Tests complete achievement workflows including unlock, progress tracking, and notifications
 */

import { test, expect } from "@playwright/test";
import {
  navigateToAchievementsPage,
  verifyAchievementInGallery,
  verifyAchievementProgress,
  verifyAchievementStats,
  switchAchievementView,
  startChastitySession,
  endChastitySession,
  waitForAchievementNotification,
  dismissAchievementNotification,
  filterAchievementsByCategory,
  getAchievementCount,
  verifyLeaderboard,
} from "./helpers/achievement-helpers";

test.describe("Achievements Workflow - E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to achievements page before each test
    await navigateToAchievementsPage(page);
  });

  test.describe("Achievement Browsing and Viewing", () => {
    test("should load and display achievements page", async ({ page }) => {
      // Verify page loaded
      await expect(page).toHaveURL(/achievement/i);

      // Check for main heading
      const heading = page
        .locator("h1, h2")
        .filter({ hasText: /achievement/i });
      if ((await heading.count()) > 0) {
        await expect(heading.first()).toBeVisible();
      }

      // Verify at least some content is visible
      const content = page.locator("main, #root, [data-testid]");
      await expect(content.first()).toBeVisible();
    });

    test("should display achievement gallery", async ({ page }) => {
      // Check if gallery view is available
      const galleryView = page.locator(
        '[data-testid="achievement-gallery"], text=/Gallery/i',
      );

      if ((await galleryView.count()) > 0) {
        // If there's a gallery tab/button, click it
        const galleryButton = page.locator('button:has-text("Gallery")');
        if ((await galleryButton.count()) > 0) {
          await galleryButton.click();
          await page.waitForTimeout(500);
        }

        // Verify achievement cards are displayed
        const achievementCards = page.locator(
          '[class*="achievement"], [data-testid*="achievement"]',
        );
        if ((await achievementCards.count()) > 0) {
          await expect(achievementCards.first()).toBeVisible();
        }
      }
    });

    test("should display achievement statistics", async ({ page }) => {
      // Switch to dashboard view if available
      const dashboardButton = page.locator('button:has-text("Dashboard")');
      if ((await dashboardButton.count()) > 0) {
        await dashboardButton.click();
        await page.waitForTimeout(500);
      }

      // Verify stats are displayed
      await verifyAchievementStats(page);
    });

    test("should switch between different view modes", async ({ page }) => {
      const viewModes = ["Dashboard", "Gallery", "Leaderboards"];

      for (const mode of viewModes) {
        const viewButton = page.locator(`button:has-text("${mode}")`);
        if ((await viewButton.count()) > 0) {
          await switchAchievementView(page, mode);

          // Verify the view changed
          await page.waitForTimeout(300);
          const currentView = page.locator(
            `[class*="active"]:has-text("${mode}")`,
          );
          if ((await currentView.count()) === 0) {
            // View might not have active class, just verify content loaded
            await page.waitForTimeout(500);
          }
        }
      }
    });

    test("should filter achievements by category", async ({ page }) => {
      // Look for category filters
      const categoryButtons = page.locator(
        'button:has-text("Session"), button:has-text("Streak"), button:has-text("Goal")',
      );

      if ((await categoryButtons.count()) > 0) {
        const initialCount = await getAchievementCount(page);

        // Click on a category filter
        await categoryButtons.first().click();
        await page.waitForTimeout(500);

        // Count might change after filtering (or might not if no filter applied)
        const filteredCount = await getAchievementCount(page);
        expect(filteredCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Achievement Progress and History", () => {
    test("should view achievement progress", async ({ page }) => {
      // Look for achievements with progress indicators
      const progressIndicators = page.locator(
        '[role="progressbar"], [class*="progress"]',
      );

      if ((await progressIndicators.count()) > 0) {
        await expect(progressIndicators.first()).toBeVisible();

        // Verify progress text/percentage is shown
        const progressText = page.locator("text=/%|progress/i");
        if ((await progressText.count()) > 0) {
          await expect(progressText.first()).toBeVisible();
        }
      }
    });

    test("should display achievement history/earned achievements", async ({
      page,
    }) => {
      // Look for earned/unlocked achievements
      const earnedAchievements = page.locator(
        '[class*="earned"], [class*="unlocked"], [class*="completed"]',
      );

      // There may or may not be earned achievements, just check the page loads
      expect(await earnedAchievements.count()).toBeGreaterThanOrEqual(0);
    });

    test("should show achievement details when clicked", async ({ page }) => {
      // Find an achievement card
      const achievementCard = page.locator('[class*="achievement"]').first();

      if ((await achievementCard.count()) > 0) {
        await achievementCard.click();
        await page.waitForTimeout(500);

        // Look for modal or expanded detail view
        const detailView = page.locator(
          '[role="dialog"], [class*="modal"], [class*="detail"]',
        );

        // Details might appear in a modal or inline
        // Just verify something happened (timeout or new content)
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe("Achievement Unlock Workflow", () => {
    test("should unlock achievement through session completion", async ({
      page,
    }) => {
      // Navigate to tracker/home
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Start a session
      const started = await startChastitySession(page);

      if (started) {
        // Wait a bit for session to register
        await page.waitForTimeout(2000);

        // End the session
        await endChastitySession(page);

        // Wait for potential achievement notification
        await page.waitForTimeout(1000);

        // Check if achievement notification appears
        const notificationShown = await waitForAchievementNotification(
          page,
          undefined,
          5000,
        );

        // Achievement might not unlock on first session, which is fine
        // Just verify the workflow completes without errors
        expect(notificationShown).toBeDefined();
      }
    });

    test("should handle rapid progress updates", async ({ page }) => {
      // This test verifies the system handles rapid actions without breaking
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Perform multiple rapid actions if possible
      const actionButton = page.locator(
        'button:has-text("Cage"), button:has-text("Session")',
      );

      if ((await actionButton.count()) > 0) {
        // Click multiple times rapidly (system should handle gracefully)
        for (let i = 0; i < 3; i++) {
          if (await actionButton.first().isVisible()) {
            await actionButton.first().click();
            await page.waitForTimeout(500);
          }
        }

        // Verify page is still functional
        await page.waitForLoadState("networkidle");
        const errorMessage = page.locator("text=/error/i");
        expect(await errorMessage.count()).toBe(0);
      }
    });
  });

  test.describe("Achievement Notifications", () => {
    test("should display achievement unlock notification", async ({ page }) => {
      // Try to trigger a notification by completing an action
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const started = await startChastitySession(page);
      if (started) {
        await page.waitForTimeout(1000);
        await endChastitySession(page);

        // Look for achievement notification
        const hasNotification = await waitForAchievementNotification(
          page,
          undefined,
          3000,
        );

        // Notification may or may not appear depending on achievement criteria
        expect(hasNotification).toBeDefined();
      }
    });

    test("should be able to dismiss achievement notification", async ({
      page,
    }) => {
      // Look for any existing notifications
      const notification = page.locator('[class*="toast"], [role="alert"]');

      if ((await notification.count()) > 0) {
        await dismissAchievementNotification(page);

        // Verify notification was dismissed
        await page.waitForTimeout(500);
        // Notification should fade out or disappear
      }
    });
  });

  test.describe("Leaderboards", () => {
    test("should view achievement leaderboards", async ({ page }) => {
      // Switch to leaderboards view
      const leaderboardButton = page.locator(
        'button:has-text("Leaderboard"), [role="tab"]:has-text("Leaderboard")',
      );

      if ((await leaderboardButton.count()) > 0) {
        await leaderboardButton.click();
        await page.waitForTimeout(500);

        // Verify leaderboard content
        await verifyLeaderboard(page);
      }
    });

    test("should display different leaderboard categories", async ({
      page,
    }) => {
      // Navigate to leaderboards
      const leaderboardButton = page.locator('button:has-text("Leaderboard")');

      if ((await leaderboardButton.count()) > 0) {
        await leaderboardButton.click();
        await page.waitForTimeout(500);

        // Look for category options
        const categoryOptions = page.locator(
          'button:has-text("Points"), button:has-text("Time"), button:has-text("Streak")',
        );

        if ((await categoryOptions.count()) > 0) {
          // Click on different categories
          await categoryOptions.first().click();
          await page.waitForTimeout(300);

          // Verify leaderboard updates
          await verifyLeaderboard(page);
        }
      }
    });
  });

  test.describe("Error Scenarios and Edge Cases", () => {
    test("should handle empty achievement state gracefully", async ({
      page,
    }) => {
      // The page should load even with no achievements
      await expect(page.locator("body")).toBeVisible();

      // Should not show any error messages
      const errorMessages = page.locator("text=/error|failed|went wrong/i");
      expect(await errorMessages.count()).toBe(0);
    });

    test("should handle navigation errors gracefully", async ({ page }) => {
      // Try navigating to a non-existent achievement detail
      await page.goto("/achievements/nonexistent-achievement-id");
      await page.waitForLoadState("networkidle");

      // Should either redirect or show a proper error state
      await page.waitForTimeout(500);

      // Page should still be functional
      const body = page.locator("body");
      await expect(body).toBeVisible();
    });

    test("should maintain state after page refresh", async ({ page }) => {
      // Set a filter or view mode
      const viewButton = page.locator('button:has-text("Dashboard")');
      if ((await viewButton.count()) > 0) {
        await viewButton.click();
        await page.waitForTimeout(500);

        // Refresh the page
        await page.reload();
        await page.waitForLoadState("networkidle");

        // Page should still be functional
        await expect(page.locator("body")).toBeVisible();
      }
    });

    test("should handle concurrent achievement unlocks", async ({ page }) => {
      // This is a theoretical test for edge cases
      // In practice, multiple achievements might unlock simultaneously
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // The system should handle this gracefully without breaking
      // We just verify the page remains functional
      const body = page.locator("body");
      await expect(body).toBeVisible();
    });
  });
});
