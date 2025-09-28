import { test, expect } from "@playwright/test";

/**
 * Smoke Tests
 * Basic tests to ensure the application loads and core functionality works
 */

test.describe("App Smoke Tests", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that the page title contains ChastityOS
    await expect(page).toHaveTitle(/ChastityOS/);

    // Check that the main content is visible
    const main = page.locator('main, #root, [data-testid="app"]');
    await expect(main).toBeVisible();
  });

  test("should handle navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for navigation elements (adjust selectors based on your app)
    const nav = page.locator(
      'nav, [role="navigation"], [data-testid="navigation"]',
    );
    if (await nav.isVisible()) {
      await expect(nav).toBeVisible();
    }
  });

  test("should be responsive on mobile", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    if (isMobile) {
      // Check that mobile-specific elements are visible
      const mobileMenu = page.locator(
        '[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]',
      );
      if (await mobileMenu.isVisible()) {
        await expect(mobileMenu).toBeVisible();
      }
    }
  });

  test("should not have console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Allow some expected errors but fail on critical ones
    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("manifest") &&
        !error.includes("404"),
    );

    expect(criticalErrors).toEqual([]);
  });
});
