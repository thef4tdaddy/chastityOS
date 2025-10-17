/**
 * Task Test Helpers
 * Utilities for testing task management workflows
 */

import { Page, expect } from "@playwright/test";
import type { TaskStatus, TaskPriority } from "../../src/types/core";

/**
 * Mock task data for testing
 */
export interface TestTask {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  assignedBy: "submissive" | "keyholder";
}

/**
 * Create a test task object
 */
export const createTestTask = (overrides?: Partial<TestTask>): TestTask => ({
  title: "Test Task",
  description: "This is a test task",
  status: "pending" as TaskStatus,
  priority: "medium" as TaskPriority,
  assignedBy: "keyholder",
  ...overrides,
});

/**
 * Navigate to tasks page
 */
export const navigateToTasksPage = async (page: Page): Promise<void> => {
  await page.goto("/tasks");
  await page.waitForLoadState("networkidle");
};

/**
 * Create a new task
 */
export const createTask = async (
  page: Page,
  taskData: Partial<TestTask>,
): Promise<boolean> => {
  // Look for "Create Task" or "Add Task" button
  const createButton = page.locator(
    'button:has-text("Create Task"), button:has-text("Add Task"), button:has-text("New Task")',
  );

  if (!(await createButton.isVisible({ timeout: 5000 }))) {
    return false;
  }

  await createButton.click();
  await page.waitForTimeout(500);

  // Fill in task title
  const titleInput = page.locator(
    'input[name="title"], input[placeholder*="title" i], input[id*="title"]',
  );
  if (await titleInput.isVisible()) {
    await titleInput.fill(taskData.title || "Test Task");
  }

  // Fill in task description if provided
  if (taskData.description) {
    const descriptionInput = page.locator(
      'textarea[name="description"], textarea[placeholder*="description" i], input[name="description"]',
    );
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(taskData.description);
    }
  }

  // Set priority if available
  if (taskData.priority) {
    const prioritySelect = page.locator(
      'select[name="priority"], [role="combobox"]:has-text("Priority")',
    );
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption(taskData.priority);
    }
  }

  // Submit the form
  const submitButton = page.locator(
    'button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Add")',
  );
  await submitButton.click();
  await page.waitForTimeout(1000);

  return true;
};

/**
 * Assign a task to a submissive
 */
export const assignTask = async (
  page: Page,
  taskId: string,
  submissiveId: string,
): Promise<boolean> => {
  // Find the task in the list
  const taskItem = page.locator(`[data-task-id="${taskId}"]`).first();

  if (!(await taskItem.isVisible({ timeout: 3000 }))) {
    // Try alternative selector
    const altTaskItem = page
      .locator('[class*="task"]')
      .filter({ hasText: taskId });
    if ((await altTaskItem.count()) > 0) {
      await altTaskItem.first().click();
    } else {
      return false;
    }
  } else {
    await taskItem.click();
  }

  await page.waitForTimeout(500);

  // Look for assign button
  const assignButton = page.locator(
    'button:has-text("Assign"), button:has-text("Assign Task")',
  );
  if (await assignButton.isVisible()) {
    await assignButton.click();
    await page.waitForTimeout(500);

    // Select submissive from dropdown or list
    const submissiveOption = page.locator(
      `[value="${submissiveId}"], [data-user-id="${submissiveId}"]`,
    );
    if (await submissiveOption.isVisible()) {
      await submissiveOption.click();
    }

    // Confirm assignment
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Save")',
    );
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      await page.waitForTimeout(500);
    }
  }

  return true;
};

/**
 * Upload evidence for a task
 */
export const uploadEvidence = async (
  page: Page,
  filePath: string,
): Promise<boolean> => {
  // Look for file upload input
  const fileInput = page.locator('input[type="file"]');

  if (!(await fileInput.isVisible({ timeout: 3000 }))) {
    // Try to click on upload button to reveal file input
    const uploadButton = page.locator(
      'button:has-text("Upload"), button:has-text("Add Evidence"), label:has-text("Upload")',
    );
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      await page.waitForTimeout(500);
    }
  }

  if (await fileInput.isVisible()) {
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(1000);
    return true;
  }

  return false;
};

/**
 * Submit a task for review
 */
export const submitTaskForReview = async (
  page: Page,
  note?: string,
): Promise<boolean> => {
  // Add submissive note if provided
  if (note) {
    const noteInput = page.locator(
      'textarea[name="note"], textarea[placeholder*="note" i], input[name="note"]',
    );
    if (await noteInput.isVisible()) {
      await noteInput.fill(note);
    }
  }

  // Click submit button
  const submitButton = page.locator(
    'button:has-text("Submit"), button:has-text("Submit for Review")',
  );

  if (!(await submitButton.isVisible({ timeout: 3000 }))) {
    return false;
  }

  await submitButton.click();
  await page.waitForTimeout(1000);

  // Confirm if there's a confirmation dialog
  const confirmButton = page.locator(
    'button:has-text("Confirm"), button:has-text("Yes")',
  );
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
    await page.waitForTimeout(500);
  }

  return true;
};

/**
 * Approve a task
 */
export const approveTask = async (
  page: Page,
  feedback?: string,
): Promise<boolean> => {
  // Add keyholder feedback if provided
  if (feedback) {
    const feedbackInput = page.locator(
      'textarea[name="feedback"], textarea[placeholder*="feedback" i], input[name="feedback"]',
    );
    if (await feedbackInput.isVisible()) {
      await feedbackInput.fill(feedback);
    }
  }

  // Click approve button
  const approveButton = page.locator(
    'button:has-text("Approve"), button:has-text("Accept")',
  );

  if (!(await approveButton.isVisible({ timeout: 3000 }))) {
    return false;
  }

  await approveButton.click();
  await page.waitForTimeout(1000);

  // Confirm if there's a confirmation dialog
  const confirmButton = page.locator(
    'button:has-text("Confirm"), button:has-text("Yes")',
  );
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
    await page.waitForTimeout(500);
  }

  return true;
};

/**
 * Reject a task
 */
export const rejectTask = async (
  page: Page,
  reason?: string,
): Promise<boolean> => {
  // Add rejection reason if provided
  if (reason) {
    const reasonInput = page.locator(
      'textarea[name="reason"], textarea[placeholder*="reason" i], input[name="feedback"]',
    );
    if (await reasonInput.isVisible()) {
      await reasonInput.fill(reason);
    }
  }

  // Click reject button
  const rejectButton = page.locator(
    'button:has-text("Reject"), button:has-text("Decline")',
  );

  if (!(await rejectButton.isVisible({ timeout: 3000 }))) {
    return false;
  }

  await rejectButton.click();
  await page.waitForTimeout(1000);

  // Confirm if there's a confirmation dialog
  const confirmButton = page.locator(
    'button:has-text("Confirm"), button:has-text("Yes")',
  );
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
    await page.waitForTimeout(500);
  }

  return true;
};

/**
 * Verify task status
 */
export const verifyTaskStatus = async (
  page: Page,
  taskTitle: string,
  expectedStatus: TaskStatus,
): Promise<boolean> => {
  // Find the task by title
  const taskElement = page
    .locator('[class*="task"]')
    .filter({ hasText: taskTitle });

  if ((await taskElement.count()) === 0) {
    return false;
  }

  // Check for status indicator
  const statusIndicator = taskElement.locator(
    `[class*="status"], [data-status="${expectedStatus}"]`,
  );

  if ((await statusIndicator.count()) > 0) {
    await expect(statusIndicator.first()).toBeVisible();
    return true;
  }

  // Check for status text
  const statusText = taskElement.locator(`text=/\\b${expectedStatus}\\b/i`);
  if ((await statusText.count()) > 0) {
    await expect(statusText.first()).toBeVisible();
    return true;
  }

  return false;
};

/**
 * Verify points awarded
 */
export const verifyPointsAwarded = async (
  page: Page,
  expectedPoints: number,
): Promise<boolean> => {
  // Look for points display
  const pointsDisplay = page.locator(
    `text=/\\+?${expectedPoints}\\s*(points?|pts?)/i`,
  );

  if ((await pointsDisplay.count()) > 0) {
    await expect(pointsDisplay.first()).toBeVisible();
    return true;
  }

  // Check for points in notification
  const notification = page.locator('[class*="toast"], [role="alert"]');
  if ((await notification.count()) > 0) {
    const notificationText = await notification.first().textContent();
    if (notificationText && notificationText.includes(String(expectedPoints))) {
      return true;
    }
  }

  return false;
};

/**
 * Verify evidence is visible
 */
export const verifyEvidenceVisible = async (page: Page): Promise<boolean> => {
  // Look for image or attachment indicators
  const evidenceIndicators = page.locator(
    'img[alt*="evidence"], [class*="attachment"], [data-testid*="evidence"]',
  );

  if ((await evidenceIndicators.count()) > 0) {
    await expect(evidenceIndicators.first()).toBeVisible();
    return true;
  }

  return false;
};

/**
 * Filter tasks by status
 */
export const filterTasksByStatus = async (
  page: Page,
  status: TaskStatus,
): Promise<void> => {
  // Look for filter dropdown or buttons
  const filterButton = page.locator(
    'button:has-text("Filter"), [class*="filter"]',
  );

  if (await filterButton.isVisible()) {
    await filterButton.click();
    await page.waitForTimeout(300);
  }

  // Click on the status filter
  const statusFilter = page.locator(
    `button:has-text("${status}"), input[value="${status}"]`,
  );

  if (await statusFilter.isVisible()) {
    await statusFilter.click();
    await page.waitForTimeout(500);
  }
};

/**
 * Search for a task
 */
export const searchTask = async (
  page: Page,
  searchTerm: string,
): Promise<void> => {
  const searchInput = page.locator(
    'input[type="search"], input[placeholder*="search" i]',
  );

  if (await searchInput.isVisible()) {
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(500);
  }
};

/**
 * Get task count
 */
export const getTaskCount = async (page: Page): Promise<number> => {
  const taskElements = page.locator(
    '[class*="task-item"], [data-testid*="task"]',
  );
  return await taskElements.count();
};

/**
 * Wait for notification
 */
export const waitForNotification = async (
  page: Page,
  message?: string,
  timeout = 5000,
): Promise<boolean> => {
  try {
    const notification = page.locator('[class*="toast"], [role="alert"]');
    await notification.first().waitFor({ timeout });

    if (message) {
      const notificationText = await notification.first().textContent();
      return notificationText?.includes(message) || false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Dismiss notification
 */
export const dismissNotification = async (page: Page): Promise<void> => {
  const closeButton = page.locator(
    '[class*="toast"] button, [role="alert"] button[aria-label*="close" i]',
  );

  if (await closeButton.isVisible()) {
    await closeButton.click();
    await page.waitForTimeout(300);
  }
};

/**
 * Verify recurring task badge/indicator
 */
export const verifyRecurringTaskIndicator = async (
  page: Page,
  taskTitle: string,
): Promise<boolean> => {
  const taskElement = page
    .locator('[class*="task"]')
    .filter({ hasText: taskTitle });

  if ((await taskElement.count()) === 0) {
    return false;
  }

  // Look for recurring indicator
  const recurringIndicator = taskElement.locator(
    '[class*="recurring"], [data-recurring="true"], text=/recurring/i',
  );

  return (await recurringIndicator.count()) > 0;
};

/**
 * Open task details
 */
export const openTaskDetails = async (
  page: Page,
  taskTitle: string,
): Promise<boolean> => {
  const taskElement = page
    .locator('[class*="task"]')
    .filter({ hasText: taskTitle });

  if ((await taskElement.count()) === 0) {
    return false;
  }

  await taskElement.first().click();
  await page.waitForTimeout(500);

  return true;
};

/**
 * Close task details modal/panel
 */
export const closeTaskDetails = async (page: Page): Promise<void> => {
  const closeButton = page.locator(
    '[role="dialog"] button[aria-label*="close" i], button:has-text("Close")',
  );

  if (await closeButton.isVisible()) {
    await closeButton.click();
    await page.waitForTimeout(300);
  }
};

/**
 * Verify punishment applied
 */
export const verifyPunishmentApplied = async (
  page: Page,
  punishmentDescription: string,
): Promise<boolean> => {
  const punishmentElement = page.locator(`text=/${punishmentDescription}/i`);

  if ((await punishmentElement.count()) > 0) {
    await expect(punishmentElement.first()).toBeVisible();
    return true;
  }

  // Check in notification
  const notification = page.locator('[class*="toast"], [role="alert"]');
  if ((await notification.count()) > 0) {
    const notificationText = await notification.first().textContent();
    if (notificationText?.includes(punishmentDescription)) {
      return true;
    }
  }

  return false;
};
