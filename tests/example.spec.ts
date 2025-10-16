import { test, expect } from "@playwright/test";

test.describe("ChastityOS Application", () => {
  test("should load the application successfully", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads without error
    await expect(page).toHaveTitle(/ChastityOS/);

    // Check for basic application structure
    await expect(page.locator("body")).toBeVisible();
  });

  test("should display main navigation", async ({ page }) => {
    await page.goto("/");

    // Wait for app to load
    await page.waitForLoadState("networkidle");

    // Look for any navigation elements or main content
    // This is a basic test that can be expanded as the UI is better defined
    const mainContent = page.locator('[class*="min-h-screen"], main, #root');
    await expect(mainContent).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that the page is visible and functional on mobile
    await expect(page.locator("body")).toBeVisible();

    // Take a screenshot for visual validation
    await page.screenshot({
      path: `test-results/mobile-${browserName}.png`,
      fullPage: true,
    });
  });
});
