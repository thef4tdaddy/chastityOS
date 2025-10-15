/**
 * Event Test Helpers
 * Utilities for testing event logging workflows
 */

import { Page, expect } from "@playwright/test";

/**
 * Navigate to the Log Event page
 */
export const navigateToLogEventPage = async (page: Page) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Try different navigation methods
  const navSelect = page.locator("select");
  if (await navSelect.isVisible()) {
    await navSelect.selectOption("logEvent");
    await page.waitForTimeout(500);
  } else {
    // Try clicking navigation button/link
    const logEventButton = page.locator(
      'button:has-text("Log Event"), a[href*="log"], button:has-text("Events")',
    );
    if (await logEventButton.isVisible()) {
      await logEventButton.click();
      await page.waitForTimeout(500);
    }
  }
};

/**
 * Helper to fill a single form field if present
 */
const fillFieldIfVisible = async (
  page: Page,
  selector: string,
  value: string,
  useFirst = false,
) => {
  const field = page.locator(selector);
  const targetField = useFirst ? field.first() : field;
  if (await targetField.isVisible()) {
    await targetField.fill(value);
  }
};

/**
 * Fill out and submit an event form
 */
export const logEvent = async (
  page: Page,
  eventData: {
    type?: string;
    date?: string;
    time?: string;
    notes?: string;
    duration?: { hours?: string; minutes?: string };
    intensity?: string;
    mood?: string;
  },
) => {
  // Select event type if provided
  if (eventData.type) {
    const eventTypeButton = page.locator(
      `button:has-text("${eventData.type}"), [data-event-type="${eventData.type}"]`,
    );
    if (await eventTypeButton.isVisible()) {
      await eventTypeButton.click();
      await page.waitForTimeout(200);
    }
  }

  // Fill form fields
  if (eventData.date) {
    await fillFieldIfVisible(
      page,
      'input[type="date"], input[id*="date"]',
      eventData.date,
    );
  }
  if (eventData.time) {
    await fillFieldIfVisible(
      page,
      'input[type="time"], input[id*="time"]',
      eventData.time,
    );
  }
  if (eventData.notes) {
    await fillFieldIfVisible(
      page,
      'textarea[placeholder*="note" i], textarea[id*="note"]',
      eventData.notes,
    );
  }

  // Fill duration if provided
  if (eventData.duration) {
    if (eventData.duration.hours) {
      await fillFieldIfVisible(
        page,
        'input[placeholder*="hour" i], input[id*="hour"]',
        eventData.duration.hours,
        true,
      );
    }
    if (eventData.duration.minutes) {
      await fillFieldIfVisible(
        page,
        'input[placeholder*="minute" i], input[id*="minute"]',
        eventData.duration.minutes,
        true,
      );
    }
  }

  // Fill optional fields
  if (eventData.intensity) {
    await fillFieldIfVisible(
      page,
      'input[placeholder*="intensity" i], select[id*="intensity"]',
      eventData.intensity,
    );
  }
  if (eventData.mood) {
    await fillFieldIfVisible(
      page,
      'input[placeholder*="mood" i], select[id*="mood"]',
      eventData.mood,
    );
  }

  // Submit the form
  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Log Event"), button:has-text("Submit")',
  );
  await submitButton.click();
  await page.waitForTimeout(1000);
};

/**
 * Select which user to log event for (keyholder feature)
 */
export const selectUserForEvent = async (
  page: Page,
  userType: "yourself" | "submissive",
) => {
  const selector =
    userType === "yourself"
      ? 'button:has-text("Yourself")'
      : 'button:has-text("Submissive")';

  const button = page.locator(selector);
  if (await button.isVisible()) {
    await button.click();
    await page.waitForTimeout(500);
  }
};

/**
 * Verify event appears in the list
 */
export const verifyEventInList = async (
  page: Page,
  eventData: { type?: string; notes?: string },
) => {
  // Wait for events list to load
  await page.waitForTimeout(1000);

  if (eventData.type) {
    const eventTypeText = page.locator(`text=/${eventData.type}/i`);
    await expect(eventTypeText.first()).toBeVisible({ timeout: 5000 });
  }

  if (eventData.notes) {
    const notesText = page.locator(`text=/${eventData.notes}/i`);
    await expect(notesText.first()).toBeVisible({ timeout: 5000 });
  }
};

/**
 * Filter events by type or date range
 */
export const filterEvents = async (
  page: Page,
  filterOptions: { type?: string; startDate?: string; endDate?: string },
) => {
  // Look for filter controls
  if (filterOptions.type) {
    const typeFilter = page.locator(
      `select[id*="filter"], button:has-text("${filterOptions.type}")`,
    );
    if (await typeFilter.first().isVisible()) {
      await typeFilter.first().click();
      await page.waitForTimeout(500);
    }
  }

  if (filterOptions.startDate) {
    const startDateInput = page.locator(
      'input[placeholder*="start" i], input[id*="start"]',
    );
    if (await startDateInput.isVisible()) {
      await startDateInput.fill(filterOptions.startDate);
      await page.waitForTimeout(500);
    }
  }

  if (filterOptions.endDate) {
    const endDateInput = page.locator(
      'input[placeholder*="end" i], input[id*="end"]',
    );
    if (await endDateInput.isVisible()) {
      await endDateInput.fill(filterOptions.endDate);
      await page.waitForTimeout(500);
    }
  }
};

/**
 * Get the count of events displayed
 */
export const getEventCount = async (page: Page): Promise<number> => {
  // Look for event items in the list
  const eventItems = page.locator(
    '[data-testid="event"], [class*="event-item"], li',
  );
  const count = await eventItems.count();
  return count;
};

/**
 * Verify success message appears
 */
export const verifySuccessMessage = async (page: Page) => {
  const successMessage = page.locator(
    'text=/success/i, text=/logged/i, [role="alert"]',
  );
  await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
};

/**
 * Verify error message appears
 */
export const verifyErrorMessage = async (page: Page, errorText?: string) => {
  if (errorText) {
    const errorMessage = page.locator(`text=/${errorText}/i`);
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  } else {
    const errorMessage = page.locator(
      'text=/error/i, text=/failed/i, [role="alert"]',
    );
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  }
};

/**
 * Clear form fields
 */
export const clearForm = async (page: Page) => {
  // Deselect all event types
  const selectedButtons = page.locator('[aria-pressed="true"]');
  const count = await selectedButtons.count();
  for (let i = 0; i < count; i++) {
    await selectedButtons.nth(i).click();
    await page.waitForTimeout(100);
  }

  // Clear notes
  const notesInput = page.locator("textarea");
  if (await notesInput.isVisible()) {
    await notesInput.clear();
  }
};

/**
 * Delete an event from the list
 */
export const deleteEvent = async (page: Page, eventIndex: number = 0) => {
  const deleteButton = page
    .locator('button:has-text("Delete"), button[aria-label*="delete" i]')
    .nth(eventIndex);

  if (await deleteButton.isVisible()) {
    await deleteButton.click();
    await page.waitForTimeout(500);

    // Confirm deletion if modal appears
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")',
    );
    if (await confirmButton.last().isVisible()) {
      await confirmButton.last().click();
      await page.waitForTimeout(1000);
    }
  }
};

/**
 * Verify combined events view shows owner information
 */
export const verifyCombinedEventsView = async (
  page: Page,
  expectedOwners: string[],
) => {
  for (const owner of expectedOwners) {
    const ownerText = page.locator(`text=/${owner}/i`);
    await expect(ownerText.first()).toBeVisible({ timeout: 5000 });
  }
};

/**
 * Submit multiple events in rapid succession
 */
export const submitMultipleEvents = async (
  page: Page,
  count: number,
  eventData: Parameters<typeof logEvent>[1],
) => {
  for (let i = 0; i < count; i++) {
    await logEvent(page, {
      ...eventData,
      notes: `${eventData.notes || "Test event"} #${i + 1}`,
    });
    await page.waitForTimeout(200); // Small delay between submissions
  }
};
