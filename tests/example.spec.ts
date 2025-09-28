import { test, expect } from "@playwright/test";

<<<<<<< HEAD
test.describe('ChastityOS Application', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without error
    await expect(page).toHaveTitle(/ChastityOS/);
    
    // Check for basic application structure
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display main navigation', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // Look for any navigation elements or main content
    // This is a basic test that can be expanded as the UI is better defined
    const mainContent = page.locator('[class*="min-h-screen"], main, #root');
    await expect(mainContent).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, browserName }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that the page is visible and functional on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Take a screenshot for visual validation
    await page.screenshot({ 
      path: `test-results/mobile-${browserName}.png`,
      fullPage: true 
    });
  });
=======
test("has title", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test("get started link", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Click the get started link.
  await page.getByRole("link", { name: "Get started" }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(
    page.getByRole("heading", { name: "Installation" }),
  ).toBeVisible();
>>>>>>> origin/nightly
});
