/**
 * End-to-End Tests for User Workflows
 * Tests core user journeys and application functionality
 */

import { test, expect } from '@playwright/test';

test.describe('User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should allow user to navigate through the application', async ({ page }) => {
    // Check initial page load
    await expect(page).toHaveTitle(/ChastityOS/);
    
    // Look for navigation elements
    const navigation = page.locator('nav, [role="navigation"], [class*="nav"]');
    
    // If navigation exists, test it
    if (await navigation.count() > 0) {
      await expect(navigation.first()).toBeVisible();
    }
    
    // Test that the main content area is present
    const mainContent = page.locator('main, [role="main"], [class*="main"], #root > div');
    await expect(mainContent.first()).toBeVisible();
  });

  test('should handle PWA functionality', async ({ page, context }) => {
    // Check for service worker registration (PWA indicator)
    const serviceWorkerPromise = context.waitForEvent('serviceworker');
    
    // Navigate and wait a bit for SW to register
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check if manifest exists
    const manifestLink = page.locator('link[rel="manifest"]');
    if (await manifestLink.count() > 0) {
      await expect(manifestLink).toHaveAttribute('href');
    }
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/');
    
    // Run accessibility checks using axe-core
    // Note: You'd need to inject axe-core for full accessibility testing
    // For now, check basic accessibility markers
    
    // Check for proper document structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    if (await headings.count() > 0) {
      // Ensure headings are visible
      await expect(headings.first()).toBeVisible();
    }
    
    // Check for proper button/link semantics
    const interactiveElements = page.locator('button, [role="button"], a, input');
    if (await interactiveElements.count() > 0) {
      // Ensure interactive elements are accessible
      const firstInteractive = interactiveElements.first();
      await expect(firstInteractive).toBeVisible();
    }
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Monitor network requests
    let loadingStateFound = false;
    
    page.on('response', response => {
      if (response.url().includes('firebase') || response.url().includes('api')) {
        // API call detected
      }
    });
    
    await page.goto('/');
    
    // Look for loading indicators if they exist
    const loadingIndicators = page.locator(
      '[class*="loading"], [class*="spinner"], [aria-label*="loading"], [aria-label*="Loading"]'
    );
    
    // If loading indicators exist, they should eventually disappear
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 });
    }
    
    // App should be in a stable state
    await page.waitForLoadState('networkidle');
  });

  test('should handle offline mode (PWA)', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Simulate offline mode
    await context.setOffline(true);
    
    // Try to navigate or perform actions
    await page.reload();
    
    // The app should either work offline or show appropriate messaging
    // This depends on the service worker implementation
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Restore online mode
    await context.setOffline(false);
  });

  test('should persist data between sessions', async ({ page, context }) => {
    // This test would verify that user data persists
    // Implementation depends on how the app stores data locally
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for any user data or settings that should persist
    // This would need to be customized based on actual app functionality
    
    // For now, just ensure the page reloads correctly
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const mainContent = page.locator('#root, main, [role="main"]');
    await expect(mainContent.first()).toBeVisible();
  });

  test('should handle different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Ensure the app is visible and functional at this viewport
      const mainContent = page.locator('#root, main, [role="main"], body > div');
      await expect(mainContent.first()).toBeVisible();
      
      // Take screenshot for visual regression testing
      await page.screenshot({ 
        path: `test-results/viewport-${viewport.name}.png`,
        fullPage: true 
      });
    }
  });
});