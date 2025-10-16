/**
 * Achievement Test Helpers
 * Utilities for testing achievement workflows in E2E tests
 */

import { Page, expect } from "@playwright/test";

/**
 * Navigate to the Achievements page
 */
export const navigateToAchievementsPage = async (page: Page) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Try different navigation methods
  const navSelect = page.locator("select");
  if (await navSelect.isVisible()) {
    await navSelect.selectOption("achievements");
    await page.waitForTimeout(500);
  } else {
    // Try clicking navigation button/link
    const achievementsLink = page.locator(
      'a[href*="achievement"], button:has-text("Achievements"), nav a:has-text("Achievements")',
    );
    if ((await achievementsLink.count()) > 0) {
      await achievementsLink.first().click();
      await page.waitForTimeout(500);
    } else {
      // Direct navigation
      await page.goto("/achievements");
      await page.waitForLoadState("networkidle");
    }
  }
};

/**
 * Check if an achievement is visible in the gallery
 */
export const verifyAchievementInGallery = async (
  page: Page,
  achievementName: string,
) => {
  const achievement = page.locator(`text=${achievementName}`);
  await expect(achievement).toBeVisible({ timeout: 5000 });
};

/**
 * Check if an achievement is unlocked (earned)
 */
export const verifyAchievementUnlocked = async (
  page: Page,
  achievementName: string,
) => {
  // Look for unlocked/earned indicators
  const achievementCard = page.locator(
    `[data-achievement-name="${achievementName}"], :has-text("${achievementName}")`,
  );

  // Check for visual indicators of unlocked state
  const unlockedIndicators = achievementCard.locator(
    '[class*="unlocked"], [class*="earned"], [class*="completed"], text=/Earned|Unlocked|Completed/i',
  );

  if ((await unlockedIndicators.count()) > 0) {
    await expect(unlockedIndicators.first()).toBeVisible();
  }
};

/**
 * Check achievement progress
 */
export const verifyAchievementProgress = async (
  page: Page,
  achievementName: string,
  expectedProgress?: number,
) => {
  const achievementCard = page
    .locator(`:has-text("${achievementName}")`)
    .first();

  // Look for progress indicators
  const progressBar = achievementCard.locator(
    '[role="progressbar"], [class*="progress"], [class*="Progress"]',
  );

  if ((await progressBar.count()) > 0) {
    await expect(progressBar.first()).toBeVisible();

    // If expected progress is provided, verify it
    if (expectedProgress !== undefined) {
      const progressText = page.locator(`text=/${expectedProgress}%/i`);
      if ((await progressText.count()) > 0) {
        await expect(progressText.first()).toBeVisible();
      }
    }
  }
};

/**
 * Filter achievements by category
 */
export const filterAchievementsByCategory = async (
  page: Page,
  category: string,
) => {
  // Look for category filter buttons or dropdown
  const categoryFilter = page.locator(
    `button:has-text("${category}"), select option:has-text("${category}")`,
  );

  if ((await categoryFilter.count()) > 0) {
    await categoryFilter.first().click();
    await page.waitForTimeout(500);
  }
};

/**
 * Wait for achievement notification to appear
 */
export const waitForAchievementNotification = async (
  page: Page,
  achievementName?: string,
  timeout = 10000,
) => {
  // Look for notification/toast with achievement content
  const notificationSelectors = [
    '[class*="toast"], [role="alert"], [class*="notification"]',
    "text=/Achievement.*Unlocked/i",
    "text=/You.*earned/i",
  ];

  for (const selector of notificationSelectors) {
    const notification = page.locator(selector);
    if ((await notification.count()) > 0) {
      await expect(notification.first()).toBeVisible({ timeout });

      // If specific achievement name provided, verify it's in the notification
      if (achievementName) {
        const achievementInNotification = page.locator(
          `text=${achievementName}`,
        );
        if ((await achievementInNotification.count()) > 0) {
          await expect(achievementInNotification.first()).toBeVisible();
        }
      }
      return true;
    }
  }
  return false;
};

/**
 * Dismiss achievement notification
 */
export const dismissAchievementNotification = async (page: Page) => {
  const closeButton = page.locator(
    '[class*="toast"] button, [role="alert"] button, button[aria-label*="close"]',
  );

  if ((await closeButton.count()) > 0) {
    await closeButton.first().click();
    await page.waitForTimeout(300);
  }
};

/**
 * Check achievement statistics
 */
export const verifyAchievementStats = async (page: Page) => {
  // Look for stats like total achievements, points, completion percentage
  const statsSelectors = [
    "text=/Total.*Achievement/i",
    "text=/Points/i",
    "text=/\\d+%/", // Percentage
    "text=/\\d+\\/\\d+/", // X/Y format
  ];

  for (const selector of statsSelectors) {
    const stat = page.locator(selector);
    if ((await stat.count()) > 0) {
      await expect(stat.first()).toBeVisible();
    }
  }
};

/**
 * Switch between achievement view modes (dashboard/gallery/leaderboards)
 */
export const switchAchievementView = async (page: Page, viewMode: string) => {
  const viewButton = page.locator(
    `button:has-text("${viewMode}"), [role="tab"]:has-text("${viewMode}")`,
  );

  if ((await viewButton.count()) > 0) {
    await viewButton.first().click();
    await page.waitForTimeout(500);
  }
};

/**
 * Start a chastity session to trigger achievements
 */
export const startChastitySession = async (page: Page) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const startButton = page.locator(
    'button:has-text("Cage On"), button:has-text("Start Session")',
  );

  if ((await startButton.count()) > 0) {
    await startButton.click();
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
};

/**
 * End a chastity session to trigger achievements
 */
export const endChastitySession = async (page: Page) => {
  const endButton = page.locator(
    'button:has-text("Cage Off"), button:has-text("End Session"), button:has-text("Stop")',
  );

  if ((await endButton.count()) > 0) {
    await endButton.click();

    // Handle confirmation modal if present
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("End")',
    );
    if ((await confirmButton.count()) > 0) {
      await confirmButton.click();
    }

    await page.waitForTimeout(1000);
    return true;
  }
  return false;
};

/**
 * Get achievement count from the page
 */
export const getAchievementCount = async (page: Page): Promise<number> => {
  // Try to find achievement cards/items
  const achievementCards = page.locator(
    '[data-testid="achievement-card"], [class*="achievement-card"], [class*="AchievementCard"]',
  );

  const count = await achievementCards.count();
  return count;
};

/**
 * Verify leaderboard is displayed
 */
export const verifyLeaderboard = async (page: Page) => {
  const leaderboard = page.locator(
    '[data-testid="leaderboard"], [class*="leaderboard"], text=/Leaderboard/i',
  );

  if ((await leaderboard.count()) > 0) {
    await expect(leaderboard.first()).toBeVisible();
  }
};

/**
 * Check if achievement is hidden (for hidden achievements)
 */
export const verifyAchievementHidden = async (
  page: Page,
  achievementName: string,
) => {
  const achievement = page.locator(`text=${achievementName}`);
  await expect(achievement).not.toBeVisible();
};

/**
 * Verify achievement difficulty/rarity indicator
 */
export const verifyAchievementDifficulty = async (
  page: Page,
  achievementName: string,
  difficulty: string,
) => {
  const achievementCard = page
    .locator(`:has-text("${achievementName}")`)
    .first();
  const difficultyBadge = achievementCard.locator(`text=/${difficulty}/i`);

  if ((await difficultyBadge.count()) > 0) {
    await expect(difficultyBadge.first()).toBeVisible();
  }
};
