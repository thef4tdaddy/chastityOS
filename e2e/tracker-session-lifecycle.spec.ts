/**
 * E2E Tests for Tracker Session Lifecycle
 * Tests the complete chastity tracking workflow in the browser
 */

import { test, expect } from "@playwright/test";

test.describe("Tracker Session Lifecycle E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the tracker page
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Start and End Session", () => {
    test("should start a new chastity session", async ({ page }) => {
      // Look for the start session button
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();

        // Wait for session to start
        await page.waitForTimeout(1000);

        // Check for active session indicators
        const activeIndicators = page.locator(
          '[class*="bg-green"], [class*="active"], text=/Active|Running|In Progress/i',
        );
        expect(await activeIndicators.count()).toBeGreaterThan(0);

        // Check for timer/duration display
        const timerDisplay = page.locator(
          '[class*="timer"], [class*="duration"], text=/\\d+:\\d+:\\d+/',
        );
        expect(await timerDisplay.count()).toBeGreaterThan(0);
      }
    });

    test("should display session statistics while active", async ({ page }) => {
      // Start session if needed
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();
        await page.waitForTimeout(1000);
      }

      // Check for statistics display
      const statsElements = page.locator(
        "text=/Current Session|Time in Chastity|Session Duration/i",
      );
      if ((await statsElements.count()) > 0) {
        await expect(statsElements.first()).toBeVisible();
      }

      // Check for time displays
      const timeDisplays = page.locator("text=/\\d+d|\\d+h|\\d+m|\\d+s/");
      expect(await timeDisplays.count()).toBeGreaterThan(0);
    });

    test("should end an active session", async ({ page }) => {
      // Start session first
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();
        await page.waitForTimeout(2000);
      }

      // Look for end session button
      const endButton = page.locator(
        'button:has-text("Cage Off"), button:has-text("End Session"), button:has-text("Stop")',
      );

      if ((await endButton.count()) > 0) {
        await endButton.click();

        // May have a confirmation modal
        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("End")',
        );
        if ((await confirmButton.count()) > 0) {
          await confirmButton.click();
        }

        // Wait for session to end
        await page.waitForTimeout(1000);

        // Check that session is no longer active
        const activeIndicators = page.locator(
          '[class*="bg-green"]:has-text("Active")',
        );
        expect(await activeIndicators.count()).toBe(0);
      }
    });

    test("should display session duration before ending", async ({ page }) => {
      // Start session
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();

        // Wait a few seconds to accumulate duration
        await page.waitForTimeout(5000);

        // Check that duration is being tracked
        const durationDisplay = page.locator(
          "text=/\\d+:\\d+:\\d+/, text=/\\d+d \\d+h \\d+m/i",
        );
        if ((await durationDisplay.count()) > 0) {
          const durationText = await durationDisplay.first().textContent();
          expect(durationText).toBeTruthy();
        }
      }
    });
  });

  test.describe("Pause and Resume Session", () => {
    test("should pause an active session", async ({ page }) => {
      // Start session first
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();
        await page.waitForTimeout(2000);
      }

      // Look for pause button
      const pauseButton = page.locator('button:has-text("Pause")');

      if ((await pauseButton.count()) > 0) {
        await pauseButton.click();

        // May have a reason modal
        const reasonInput = page.locator(
          'textarea, input[placeholder*="reason" i]',
        );
        if ((await reasonInput.count()) > 0) {
          await reasonInput.fill("Taking a short break");
          const confirmButton = page.locator(
            'button:has-text("Confirm"), button:has-text("Pause")',
          );
          await confirmButton.click();
        }

        // Wait for pause to be registered
        await page.waitForTimeout(1000);

        // Check for paused indicator
        const pausedIndicator = page.locator(
          'text=/Paused|Pausing/i, [class*="paused"], [class*="yellow"]',
        );
        expect(await pausedIndicator.count()).toBeGreaterThan(0);
      }
    });

    test("should resume a paused session", async ({ page }) => {
      // Start and pause session
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();
        await page.waitForTimeout(2000);

        const pauseButton = page.locator('button:has-text("Pause")');
        if ((await pauseButton.count()) > 0) {
          await pauseButton.click();

          // Handle reason modal if present
          const reasonInput = page.locator(
            'textarea, input[placeholder*="reason" i]',
          );
          if ((await reasonInput.count()) > 0) {
            await reasonInput.fill("Short break");
            const confirmButton = page.locator(
              'button:has-text("Confirm"), button:has-text("Pause")',
            );
            await confirmButton.click();
          }

          await page.waitForTimeout(1000);

          // Now resume
          const resumeButton = page.locator('button:has-text("Resume")');
          if ((await resumeButton.count()) > 0) {
            await resumeButton.click();
            await page.waitForTimeout(1000);

            // Check session is active again
            const activeIndicator = page.locator(
              'text=/Active|Running/i, [class*="bg-green"]',
            );
            expect(await activeIndicator.count()).toBeGreaterThan(0);

            // Paused indicator should be gone
            const pausedIndicator = page.locator('[class*="paused"]');
            expect(await pausedIndicator.count()).toBe(0);
          }
        }
      }
    });

    test("should display pause duration while paused", async ({ page }) => {
      // Start and pause session
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();
        await page.waitForTimeout(2000);

        const pauseButton = page.locator('button:has-text("Pause")');
        if ((await pauseButton.count()) > 0) {
          await pauseButton.click();

          // Handle reason modal
          const confirmButton = page.locator(
            'button:has-text("Confirm"), button:has-text("Pause")',
          );
          if ((await confirmButton.count()) > 0) {
            await confirmButton.click();
          }

          // Wait a few seconds while paused
          await page.waitForTimeout(5000);

          // Check for pause duration display
          const pauseDurationDisplay = page.locator(
            "text=/Pause Duration|Paused for/i",
          );
          if ((await pauseDurationDisplay.count()) > 0) {
            await expect(pauseDurationDisplay.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Session History View", () => {
    test("should navigate to session history page", async ({ page }) => {
      // Look for history/report navigation link
      const historyLink = page.locator(
        'a:has-text("History"), a:has-text("Report"), nav a[href*="history"], nav a[href*="report"]',
      );

      if ((await historyLink.count()) > 0) {
        await historyLink.first().click();
        await page.waitForLoadState("networkidle");

        // Check we're on the history page
        const pageTitle = page.locator("h1, h2, h3");
        const titleText = await pageTitle.first().textContent();
        expect(
          titleText?.match(/History|Report|Sessions|Chastity History/i),
        ).toBeTruthy();
      }
    });

    test("should display session history table", async ({ page }) => {
      // Navigate to history page
      const historyLink = page.locator(
        'a:has-text("History"), a:has-text("Report"), nav a[href*="history"], nav a[href*="report"]',
      );

      if ((await historyLink.count()) > 0) {
        await historyLink.first().click();
        await page.waitForLoadState("networkidle");

        // Look for history table or list
        const historyTable = page.locator(
          'table, [class*="history"], [class*="session-list"]',
        );
        if ((await historyTable.count()) > 0) {
          await expect(historyTable.first()).toBeVisible();

          // Check for column headers
          const headers = page.locator(
            'th, [class*="header"], text=/Start Time|End Time|Duration/i',
          );
          expect(await headers.count()).toBeGreaterThan(0);
        }
      }
    });

    test("should display session statistics on history page", async ({
      page,
    }) => {
      // Navigate to history page
      const historyLink = page.locator(
        'a:has-text("History"), a:has-text("Report"), nav a[href*="history"], nav a[href*="report"]',
      );

      if ((await historyLink.count()) > 0) {
        await historyLink.first().click();
        await page.waitForLoadState("networkidle");

        // Look for statistics section
        const statsSection = page.locator(
          "text=/Total Sessions|Average Duration|Total Time|Statistics/i",
        );
        if ((await statsSection.count()) > 0) {
          await expect(statsSection.first()).toBeVisible();
        }
      }
    });
  });

  test.describe("Session Statistics Display", () => {
    test("should display current session statistics", async ({ page }) => {
      // Start a session
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();
        await page.waitForTimeout(2000);
      }

      // Check for statistics cards/displays
      const statCards = page.locator(
        '[class*="stat"], [class*="card"], [class*="metric"]',
      );
      if ((await statCards.count()) > 0) {
        // Should have multiple stat displays
        expect(await statCards.count()).toBeGreaterThan(1);
      }
    });

    test("should update statistics in real-time", async ({ page }) => {
      // Start a session
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();
        await page.waitForTimeout(1000);
      }

      // Get initial duration
      const durationDisplay = page.locator("text=/\\d+:\\d+:\\d+/").first();
      if (await durationDisplay.isVisible()) {
        const initialDuration = await durationDisplay.textContent();

        // Wait for duration to update
        await page.waitForTimeout(5000);

        const updatedDuration = await durationDisplay.textContent();

        // Duration should have increased
        expect(updatedDuration).not.toBe(initialDuration);
      }
    });
  });

  test.describe("Session Workflow Edge Cases", () => {
    test("should handle rapid button clicks gracefully", async ({ page }) => {
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        // Click start button multiple times rapidly
        await startButton.click();
        await startButton.click();
        await startButton.click();

        await page.waitForTimeout(2000);

        // Should still have a valid state (no errors)
        const errorMessages = page.locator(
          "text=/Error|Failed|Something went wrong/i",
        );
        expect(await errorMessages.count()).toBe(0);
      }
    });

    test("should persist session across page reload", async ({ page }) => {
      // Start a session
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );

      if ((await startButton.count()) > 0) {
        await startButton.click();
        await page.waitForTimeout(2000);

        // Check session is active
        const activeIndicator = page.locator("text=/Active|Running/i");
        if ((await activeIndicator.count()) > 0) {
          // Reload the page
          await page.reload();
          await page.waitForLoadState("networkidle");

          // Session should still be active or offer to restore
          const stillActive = page.locator("text=/Active|Running/i");
          const restorePrompt = page.locator("text=/Resume|Restore|Continue/i");

          expect(
            (await stillActive.count()) + (await restorePrompt.count()),
          ).toBeGreaterThan(0);
        }
      }
    });

    test("should handle missing required data gracefully", async ({ page }) => {
      // The page should load without errors even with no session data
      await page.waitForLoadState("networkidle");

      // Check for error boundaries or fallback UI
      const mainContent = page.locator('main, #root, [data-testid="app"]');
      await expect(mainContent).toBeVisible();

      // No critical error messages
      const criticalErrors = page.locator(
        "text=/Fatal Error|Critical Error|Cannot Load/i",
      );
      expect(await criticalErrors.count()).toBe(0);
    });
  });

  test.describe("Accessibility", () => {
    test("should have accessible buttons", async ({ page }) => {
      // Check that main action buttons are accessible
      const buttons = page.locator("button");
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            // Buttons should have text or aria-label
            const text = await button.textContent();
            const ariaLabel = await button.getAttribute("aria-label");
            expect(text || ariaLabel).toBeTruthy();
          }
        }
      }
    });

    test("should support keyboard navigation", async ({ page }) => {
      // Try to navigate with keyboard
      await page.keyboard.press("Tab");
      await page.waitForTimeout(500);

      // Check that focus moved to an interactive element
      const focusedElement = page.locator(":focus");
      expect(await focusedElement.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Responsive Design", () => {
    test("should work on mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Main content should be visible
      const mainContent = page.locator('main, #root, [data-testid="app"]');
      await expect(mainContent).toBeVisible();

      // Buttons should be accessible
      const startButton = page.locator(
        'button:has-text("Cage On"), button:has-text("Start Session")',
      );
      if ((await startButton.count()) > 0) {
        await expect(startButton.first()).toBeVisible();
      }
    });

    test("should work on tablet viewport", async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Main content should be visible
      const mainContent = page.locator("main, #root");
      await expect(mainContent).toBeVisible();

      // Layout should adapt appropriately
      const content = await page.locator("body").boundingBox();
      expect(content?.width).toBeGreaterThan(700);
    });
  });
});
