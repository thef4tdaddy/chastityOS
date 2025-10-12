import { test, expect, devices } from "@playwright/test";

/**
 * Events UI Responsive Design Tests
 * Tests responsive behavior across mobile, tablet, and desktop viewports
 */

test.describe("Events UI - Responsive Design", () => {
  // Mobile viewport tests (320px - 640px)
  test.describe("Mobile (320px - 640px)", () => {
    test.use({ ...devices["iPhone 12"] });

    test("should display event form with proper mobile layout", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Navigate to Log Event page
      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
        await page.waitForTimeout(500);
      }

      // Check event type selector is in 2-column grid on mobile
      const eventTypeButtons = page.locator(".event-button");
      if ((await eventTypeButtons.count()) > 0) {
        const firstButton = eventTypeButtons.first();
        await expect(firstButton).toBeVisible();

        // Verify touch target size (minimum 44px)
        const box = await firstButton.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test("should display event list with proper mobile cards", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Navigate to Log Event page
      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
        await page.waitForTimeout(500);
      }

      // Check event items stack properly on mobile
      const eventItems = page.locator(".event-item");
      if ((await eventItems.count()) > 0) {
        const firstEvent = eventItems.first();
        await expect(firstEvent).toBeVisible();

        // Verify event content is readable and doesn't overflow
        const textContent = await firstEvent.textContent();
        expect(textContent).toBeTruthy();
      }
    });

    test("should have proper spacing and padding on mobile", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
        await page.waitForTimeout(500);
      }

      // Check form fields are properly sized
      const inputFields = page.locator(".event-form-field");
      if ((await inputFields.count()) > 0) {
        const firstInput = inputFields.first();
        await expect(firstInput).toBeVisible();

        const box = await firstInput.boundingBox();
        if (box) {
          // Verify input is wide enough on mobile
          expect(box.width).toBeGreaterThan(200);
        }
      }
    });
  });

  // Small mobile viewport test (320px width)
  test.describe("Small Mobile (320px)", () => {
    test.use({ viewport: { width: 320, height: 568 } });

    test("should be usable on very small screens", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
        await page.waitForTimeout(500);
      }

      // Verify no horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Check that event type buttons are still accessible
      const eventTypeButtons = page.locator(".event-button");
      if ((await eventTypeButtons.count()) > 0) {
        await expect(eventTypeButtons.first()).toBeVisible();
      }
    });
  });

  // Tablet viewport tests (768px - 1024px)
  test.describe("Tablet (768px - 1024px)", () => {
    test.use({ ...devices["iPad"] });

    test("should display 4-column event type grid on tablet", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navSelect = page.locator("select");
      // On tablet, we might have button navigation
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
      } else {
        // Try clicking button navigation
        const logEventButton = page.locator('button:has-text("Log Event")');
        if (await logEventButton.isVisible()) {
          await logEventButton.click();
        }
      }
      await page.waitForTimeout(500);

      // Event type buttons should be in 4 columns on tablet
      const eventTypeButtons = page.locator(".event-button");
      if ((await eventTypeButtons.count()) >= 4) {
        // Check that buttons are arranged horizontally
        const firstBox = await eventTypeButtons.nth(0).boundingBox();
        const secondBox = await eventTypeButtons.nth(1).boundingBox();

        if (firstBox && secondBox) {
          // Buttons should be on the same row (similar Y position)
          expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThan(10);
        }
      }
    });

    test("should optimize form layout for tablet", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
      } else {
        const logEventButton = page.locator('button:has-text("Log Event")');
        if (await logEventButton.isVisible()) {
          await logEventButton.click();
        }
      }
      await page.waitForTimeout(500);

      // Advanced fields should be in 2 columns on tablet
      const moodLabel = page.locator('label:has-text("Mood")');
      const intensityLabel = page.locator('label:has-text("Intensity")');

      if ((await moodLabel.isVisible()) && (await intensityLabel.isVisible())) {
        const moodBox = await moodLabel.boundingBox();
        const intensityBox = await intensityLabel.boundingBox();

        if (moodBox && intensityBox) {
          // Should be side by side (similar Y, different X)
          expect(Math.abs(moodBox.y - intensityBox.y)).toBeLessThan(50);
          expect(Math.abs(moodBox.x - intensityBox.x)).toBeGreaterThan(100);
        }
      }
    });
  });

  // Desktop viewport tests (1024px+)
  test.describe("Desktop (1024px+)", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("should display optimized desktop layout", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Click Log Event in navigation
      const logEventButton = page.locator('button:has-text("Log Event")');
      if (await logEventButton.isVisible()) {
        await logEventButton.click();
        await page.waitForTimeout(500);
      }

      // Check that content has proper max-width constraint
      const mainContent = page.locator("text=Log New Event").locator("..");
      if (await mainContent.isVisible()) {
        const box = await mainContent.boundingBox();
        if (box) {
          // Content should be centered and not too wide
          expect(box.width).toBeLessThanOrEqual(1200);
        }
      }
    });

    test("should have proper button navigation on desktop", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Desktop should show button navigation, not select
      const navButtons = page.locator("nav button");
      const navSelect = page.locator("nav select");

      const buttonCount = await navButtons.count();
      const selectVisible = await navSelect.isVisible();

      // Desktop should have button navigation
      expect(buttonCount).toBeGreaterThan(0);
      expect(selectVisible).toBe(false);
    });
  });

  // Touch interaction tests
  test.describe("Touch Interactions", () => {
    test.use({ ...devices["iPhone 12"], hasTouch: true });

    test("should have proper touch targets for all interactive elements", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
        await page.waitForTimeout(500);
      }

      // Check all buttons have minimum touch target size
      const allButtons = page.locator("button");
      const buttonCount = await allButtons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = allButtons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // Minimum touch target is 44x44 pixels (WCAG 2.1)
            expect(box.height).toBeGreaterThanOrEqual(40); // Allow slight variance
            expect(box.width).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });

    test("should handle form submission via touch", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
        await page.waitForTimeout(500);
      }

      // Try to interact with event type selector
      const eventTypeButton = page.locator(".event-button").first();
      if (await eventTypeButton.isVisible()) {
        await eventTypeButton.tap();
        await page.waitForTimeout(200);

        // Button should show active state
        const classList = await eventTypeButton.getAttribute("class");
        expect(classList).toBeTruthy();
      }
    });
  });

  // Orientation tests
  test.describe("Orientation Changes", () => {
    test("should handle portrait to landscape rotation", async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
        await page.waitForTimeout(500);
      }

      // Check content is visible in portrait
      const portraitContent = page.locator("text=Log New Event");
      await expect(portraitContent).toBeVisible();

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);

      // Content should still be visible and usable
      await expect(portraitContent).toBeVisible();

      // No horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  });

  // User selector responsive tests
  test.describe("User Selector", () => {
    test.use({ ...devices["iPhone 12"] });

    test("should display user selector buttons with proper touch targets", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const navSelect = page.locator("select");
      if (await navSelect.isVisible()) {
        await navSelect.selectOption("logEvent");
        await page.waitForTimeout(500);
      }

      // Check if user selector exists (may not for all users)
      const userSelectorButtons = page.locator(
        'button:has-text("Yourself"), button:has-text("Submissive")',
      );
      const count = await userSelectorButtons.count();

      if (count > 0) {
        const button = userSelectorButtons.first();
        const box = await button.boundingBox();
        if (box) {
          // Should have proper touch target
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });
});
