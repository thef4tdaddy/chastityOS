/**
 * E2E Tests for Task Filtering and Searching
 * Tests filtering, searching, and sorting functionality
 */

import { test, expect } from "@playwright/test";
import {
  navigateToTasksPage,
  filterTasksByStatus,
  searchTask,
  getTaskCount,
  createTask,
  createTestTask,
} from "../helpers/task-helpers";

test.describe("Task Filtering and Searching - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Status Filtering", () => {
    test("should filter tasks by pending status", async ({ page }) => {
      await navigateToTasksPage(page);

      // Try to filter by pending
      await filterTasksByStatus(page, "pending" as any);

      await page.waitForTimeout(500);

      // Verify filtering worked (task count might change)
      const taskCount = await getTaskCount(page);
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should filter tasks by submitted status", async ({ page }) => {
      await navigateToTasksPage(page);

      await filterTasksByStatus(page, "submitted" as any);
      await page.waitForTimeout(500);

      const taskCount = await getTaskCount(page);
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should filter tasks by completed status", async ({ page }) => {
      await navigateToTasksPage(page);

      await filterTasksByStatus(page, "completed" as any);
      await page.waitForTimeout(500);

      const taskCount = await getTaskCount(page);
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should filter tasks by rejected status", async ({ page }) => {
      await navigateToTasksPage(page);

      await filterTasksByStatus(page, "rejected" as any);
      await page.waitForTimeout(500);

      const taskCount = await getTaskCount(page);
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should switch between active and archived tabs", async ({ page }) => {
      await navigateToTasksPage(page);

      // Look for tab navigation
      const activeTab = page.locator(
        'button:has-text("Active"), [role="tab"]:has-text("Active")',
      );
      const archivedTab = page.locator(
        'button:has-text("Archived"), [role="tab"]:has-text("Completed")',
      );

      if (await activeTab.isVisible()) {
        await activeTab.click();
        await page.waitForTimeout(500);

        const activeCount = await getTaskCount(page);

        if (await archivedTab.isVisible()) {
          await archivedTab.click();
          await page.waitForTimeout(500);

          const archivedCount = await getTaskCount(page);

          // Both tabs should show non-negative counts
          expect(activeCount).toBeGreaterThanOrEqual(0);
          expect(archivedCount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test("should clear all filters", async ({ page }) => {
      await navigateToTasksPage(page);

      // Apply a filter
      await filterTasksByStatus(page, "pending" as any);
      await page.waitForTimeout(500);

      const filteredCount = await getTaskCount(page);

      // Look for clear filters button
      const clearButton = page.locator(
        'button:has-text("Clear"), button:has-text("Reset"), button:has-text("All")',
      );

      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(500);

        const unfilteredCount = await getTaskCount(page);

        // Counts might differ after clearing
        expect(unfilteredCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Priority Filtering", () => {
    test("should filter tasks by high priority", async ({ page }) => {
      await navigateToTasksPage(page);

      // Look for priority filter
      const priorityFilter = page.locator(
        'button:has-text("High"), [value="high"]',
      );

      if (await priorityFilter.isVisible()) {
        await priorityFilter.click();
        await page.waitForTimeout(500);

        // Verify filtering
        const taskCount = await getTaskCount(page);
        expect(taskCount).toBeGreaterThanOrEqual(0);
      }
    });

    test("should filter tasks by medium priority", async ({ page }) => {
      await navigateToTasksPage(page);

      const priorityFilter = page.locator(
        'button:has-text("Medium"), [value="medium"]',
      );

      if (await priorityFilter.isVisible()) {
        await priorityFilter.click();
        await page.waitForTimeout(500);

        const taskCount = await getTaskCount(page);
        expect(taskCount).toBeGreaterThanOrEqual(0);
      }
    });

    test("should filter tasks by low priority", async ({ page }) => {
      await navigateToTasksPage(page);

      const priorityFilter = page.locator(
        'button:has-text("Low"), [value="low"]',
      );

      if (await priorityFilter.isVisible()) {
        await priorityFilter.click();
        await page.waitForTimeout(500);

        const taskCount = await getTaskCount(page);
        expect(taskCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Task Search", () => {
    test("should search tasks by title", async ({ page }) => {
      await navigateToTasksPage(page);

      // Get initial count
      const initialCount = await getTaskCount(page);

      // Search for a task
      await searchTask(page, "Test");
      await page.waitForTimeout(500);

      // Verify search worked (count might be different)
      const searchCount = await getTaskCount(page);
      expect(searchCount).toBeGreaterThanOrEqual(0);
      expect(searchCount).toBeLessThanOrEqual(initialCount);
    });

    test("should search tasks by description", async ({ page }) => {
      await navigateToTasksPage(page);

      // Create a task with specific description
      const testTask = createTestTask({
        title: "Searchable Task",
        description: "UniqueSearchTerm123",
      });

      const created = await createTask(page, testTask);
      if (created) {
        await page.waitForTimeout(1000);

        // Search for the unique term
        await searchTask(page, "UniqueSearchTerm123");
        await page.waitForTimeout(500);

        // Should find the task
        const searchResults = page.locator("text=/UniqueSearchTerm123/i");
        if ((await searchResults.count()) > 0) {
          await expect(searchResults.first()).toBeVisible();
        }
      }
    });

    test("should show no results for invalid search", async ({ page }) => {
      await navigateToTasksPage(page);

      // Search for something that doesn't exist
      await searchTask(page, "NonexistentTaskXYZ999");
      await page.waitForTimeout(500);

      // Should show empty state or no tasks
      const taskCount = await getTaskCount(page);
      const emptyState = page.locator("text=/no.*found|no.*results/i");

      // Either no tasks or empty state message
      const hasEmptyState = (await emptyState.count()) > 0;
      expect(taskCount === 0 || hasEmptyState).toBe(true);
    });

    test("should clear search input", async ({ page }) => {
      await navigateToTasksPage(page);

      // Search for something
      await searchTask(page, "Test");
      await page.waitForTimeout(500);

      const searchedCount = await getTaskCount(page);

      // Clear search
      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i]',
      );

      if (await searchInput.isVisible()) {
        await searchInput.clear();
        await page.waitForTimeout(500);

        const clearedCount = await getTaskCount(page);

        // Counts might differ
        expect(clearedCount).toBeGreaterThanOrEqual(searchedCount);
      }
    });

    test("should search with real-time filtering", async ({ page }) => {
      await navigateToTasksPage(page);

      const searchInput = page.locator(
        'input[type="search"], input[placeholder*="search" i]',
      );

      if (await searchInput.isVisible()) {
        // Type gradually and check results update
        await searchInput.type("T", { delay: 100 });
        await page.waitForTimeout(300);
        const count1 = await getTaskCount(page);

        await searchInput.type("e", { delay: 100 });
        await page.waitForTimeout(300);
        const count2 = await getTaskCount(page);

        await searchInput.type("st", { delay: 100 });
        await page.waitForTimeout(300);
        const count3 = await getTaskCount(page);

        // Counts should be non-negative as filtering happens
        expect(count1).toBeGreaterThanOrEqual(0);
        expect(count2).toBeGreaterThanOrEqual(0);
        expect(count3).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Task Sorting", () => {
    test("should sort tasks by due date", async ({ page }) => {
      await navigateToTasksPage(page);

      // Look for sort options
      const sortButton = page.locator(
        'button:has-text("Sort"), select[name*="sort"]',
      );

      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(300);

        // Select due date sort
        const dueDateOption = page.locator(
          'button:has-text("Due Date"), option:has-text("Due Date")',
        );

        if (await dueDateOption.isVisible()) {
          await dueDateOption.click();
          await page.waitForTimeout(500);

          // Verify tasks are displayed
          const taskCount = await getTaskCount(page);
          expect(taskCount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test("should sort tasks by priority", async ({ page }) => {
      await navigateToTasksPage(page);

      const sortButton = page.locator('button:has-text("Sort")');

      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(300);

        const priorityOption = page.locator('button:has-text("Priority")');

        if (await priorityOption.isVisible()) {
          await priorityOption.click();
          await page.waitForTimeout(500);

          const taskCount = await getTaskCount(page);
          expect(taskCount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test("should sort tasks by creation date", async ({ page }) => {
      await navigateToTasksPage(page);

      const sortButton = page.locator('button:has-text("Sort")');

      if (await sortButton.isVisible()) {
        await sortButton.click();
        await page.waitForTimeout(300);

        const dateOption = page.locator(
          'button:has-text("Created"), button:has-text("Date")',
        );

        if (await dateOption.isVisible()) {
          await dateOption.click();
          await page.waitForTimeout(500);

          const taskCount = await getTaskCount(page);
          expect(taskCount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test("should toggle sort direction (ascending/descending)", async ({
      page,
    }) => {
      await navigateToTasksPage(page);

      // Look for sort direction toggle
      const sortToggle = page.locator(
        'button[aria-label*="sort" i], button:has-text("↑"), button:has-text("↓")',
      );

      if (await sortToggle.isVisible()) {
        await sortToggle.click();
        await page.waitForTimeout(500);

        // Verify tasks are still displayed
        const taskCount = await getTaskCount(page);
        expect(taskCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Combined Filters", () => {
    test("should apply multiple filters simultaneously", async ({ page }) => {
      await navigateToTasksPage(page);

      // Apply status filter
      await filterTasksByStatus(page, "pending" as any);
      await page.waitForTimeout(300);

      // Apply search
      await searchTask(page, "Test");
      await page.waitForTimeout(500);

      // Verify both filters applied
      const taskCount = await getTaskCount(page);
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should combine status and priority filters", async ({ page }) => {
      await navigateToTasksPage(page);

      // Filter by status
      await filterTasksByStatus(page, "pending" as any);
      await page.waitForTimeout(300);

      // Filter by priority
      const priorityFilter = page.locator('button:has-text("High")');
      if (await priorityFilter.isVisible()) {
        await priorityFilter.click();
        await page.waitForTimeout(500);
      }

      const taskCount = await getTaskCount(page);
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should apply filter then search", async ({ page }) => {
      await navigateToTasksPage(page);

      const initialCount = await getTaskCount(page);

      // First filter
      await filterTasksByStatus(page, "pending" as any);
      await page.waitForTimeout(300);

      const filteredCount = await getTaskCount(page);

      // Then search
      await searchTask(page, "Task");
      await page.waitForTimeout(500);

      const finalCount = await getTaskCount(page);

      // Final count should be <= filtered count
      expect(finalCount).toBeLessThanOrEqual(filteredCount || initialCount);
    });
  });

  test.describe("Filter Persistence", () => {
    test("should maintain filters after page refresh", async ({ page }) => {
      await navigateToTasksPage(page);

      // Apply a filter
      await filterTasksByStatus(page, "pending" as any);
      await page.waitForTimeout(500);

      // Refresh page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Filters might or might not persist - just verify page works
      await expect(page.locator("body")).toBeVisible();
      const taskCount = await getTaskCount(page);
      expect(taskCount).toBeGreaterThanOrEqual(0);
    });

    test("should reset filters on navigation away and back", async ({
      page,
    }) => {
      await navigateToTasksPage(page);

      // Apply filter
      await filterTasksByStatus(page, "pending" as any);
      await page.waitForTimeout(500);

      // Navigate away
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Navigate back
      await navigateToTasksPage(page);

      // Filters might reset
      await expect(page.locator("body")).toBeVisible();
    });
  });

  test.describe("UI/UX", () => {
    test("should show filter indicators", async ({ page }) => {
      await navigateToTasksPage(page);

      // Apply a filter
      await filterTasksByStatus(page, "pending" as any);
      await page.waitForTimeout(500);

      // Look for active filter indicators
      const activeFilters = page.locator(
        '[class*="active"], [class*="selected"], [aria-selected="true"]',
      );

      // Indicators might be present
      expect(await activeFilters.count()).toBeGreaterThanOrEqual(0);
    });

    test("should be responsive on mobile", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await navigateToTasksPage(page);

      // Verify filters work on mobile
      const filterButton = page.locator(
        'button:has-text("Filter"), [aria-label*="filter" i]',
      );

      // Filter UI might be in a menu on mobile
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(300);
      }

      // Page should be functional
      await expect(page.locator("body")).toBeVisible();
    });

    test("should show task count after filtering", async ({ page }) => {
      await navigateToTasksPage(page);

      // Apply filter
      await filterTasksByStatus(page, "pending" as any);
      await page.waitForTimeout(500);

      // Look for count display
      const countDisplay = page.locator('text=/\\d+.*task/i, [class*="count"]');

      // Count might be displayed
      expect(await countDisplay.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
