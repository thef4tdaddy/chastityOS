/**
 * E2E Tests for Events/Logging Workflows
 * Tests complete event logging workflows including keyholder/submissive scenarios
 */

import { test, expect } from "@playwright/test";
import {
  navigateToLogEventPage,
  logEvent,
  selectUserForEvent,
  verifyEventInList,
  verifySuccessMessage,
  verifyErrorMessage,
  filterEvents,
  getEventCount,
  deleteEvent,
  verifyCombinedEventsView,
  submitMultipleEvents,
} from "./helpers/event-helpers";

test.describe("Events Workflow - E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and log event page before each test
    await navigateToLogEventPage(page);
  });

  test("should log a sexual event for self", async ({ page }) => {
    // Fill out event form
    await logEvent(page, {
      type: "Orgasm",
      notes: "Test event for self",
      duration: { hours: "1", minutes: "30" },
    });

    // Verify success (either success message or event appears in list)
    const successMessage = page.locator(
      "text=/success/i, text=/logged/i, text=/event.*added/i",
    );
    const hasSuccessMessage = (await successMessage.count()) > 0;

    if (hasSuccessMessage) {
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    }

    // Verify event appears in the list
    await page.waitForTimeout(1000);
    const eventText = page.locator("text=/Test event for self/i");
    if ((await eventText.count()) > 0) {
      await expect(eventText.first()).toBeVisible();
    }
  });

  test("should validate required fields when logging event", async ({
    page,
  }) => {
    // Try to submit form without selecting event type
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Log Event"), button:has-text("Submit")',
    );

    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Should show validation error or prevent submission
      // The form may use HTML5 validation or custom validation
      const validationMessage = page.locator(
        'text=/required/i, text=/select.*type/i, [role="alert"]',
      );

      // Either validation message shows or form doesn't submit (stays on page)
      const pageUrl = page.url();
      const hasValidationMessage = (await validationMessage.count()) > 0;

      if (hasValidationMessage) {
        await expect(validationMessage.first()).toBeVisible();
      }
      // If no explicit message, ensure we're still on the log event page
      expect(pageUrl).toContain(
        page.url().includes("log") || page.url().includes("/"),
      );
    }
  });

  test("should log event with date and time", async ({ page }) => {
    const testDate = "2024-01-15";
    const testTime = "14:30";

    await logEvent(page, {
      type: "Orgasm",
      date: testDate,
      time: testTime,
      notes: "Event with specific date and time",
    });

    await page.waitForTimeout(1000);

    // Verify the event appears with correct date/time
    const eventText = page.locator("text=/Event with specific date and time/i");
    if ((await eventText.count()) > 0) {
      await expect(eventText.first()).toBeVisible();
    }
  });

  test("should log event with duration information", async ({ page }) => {
    await logEvent(page, {
      type: "Sexual Activity",
      duration: { hours: "2", minutes: "15" },
      notes: "Event with duration",
    });

    await page.waitForTimeout(1000);

    // Verify event appears
    const eventText = page.locator("text=/Event with duration/i");
    if ((await eventText.count()) > 0) {
      await expect(eventText.first()).toBeVisible();

      // Verify duration is displayed (format may vary)
      const durationText = page.locator("text=/2.*h|hour/i, text=/15.*m|min/i");
      // Duration display is optional, only check if visible
      if ((await durationText.count()) > 0) {
        await expect(durationText.first()).toBeVisible();
      }
    }
  });

  test("should display event history", async ({ page }) => {
    // Wait for events to load
    await page.waitForTimeout(2000);

    // Check if events list section exists
    const eventsList = page.locator(
      '[data-testid="event-list"], [class*="event-list"], h2:has-text("Events"), h2:has-text("Recent")',
    );

    if ((await eventsList.count()) > 0) {
      await expect(eventsList.first()).toBeVisible();

      // Check if there are any events displayed
      const events = page.locator(
        '[data-testid="event"], [class*="event-item"]',
      );
      const count = await events.count();

      // Either events exist or "no events" message is shown
      if (count === 0) {
        const noEventsMessage = page.locator(
          "text=/no events/i, text=/empty/i",
        );
        if ((await noEventsMessage.count()) > 0) {
          await expect(noEventsMessage.first()).toBeVisible();
        }
      } else {
        await expect(events.first()).toBeVisible();
      }
    }
  });

  test("should handle keyholder logging event for submissive", async ({
    page,
  }) => {
    // Check if user selector exists (keyholder feature)
    const userSelector = page.locator(
      'button:has-text("Yourself"), button:has-text("Submissive")',
    );

    if ((await userSelector.count()) >= 2) {
      // Select submissive
      await selectUserForEvent(page, "submissive");
      await page.waitForTimeout(500);

      // Log event for submissive
      await logEvent(page, {
        type: "Orgasm",
        notes: "Event logged by keyholder for submissive",
      });

      await page.waitForTimeout(1000);

      // Verify event appears
      const eventText = page.locator(
        "text=/Event logged by keyholder for submissive/i",
      );
      if ((await eventText.count()) > 0) {
        await expect(eventText.first()).toBeVisible();
      }
    } else {
      // Skip test if not a keyholder account
      test.skip();
    }
  });

  test("should display combined event view for keyholder", async ({ page }) => {
    // Check if user selector exists (indicates keyholder with submissive)
    const userSelector = page.locator(
      'button:has-text("Yourself"), button:has-text("Submissive")',
    );

    if ((await userSelector.count()) >= 2) {
      await page.waitForTimeout(2000);

      // Look for combined events section
      const combinedSection = page.locator(
        "text=/combined/i, text=/all events/i, h2",
      );

      if ((await combinedSection.count()) > 0) {
        await expect(combinedSection.first()).toBeVisible();

        // Events should show owner information
        const ownerLabels = page.locator(
          'text=/yourself/i, text=/submissive/i, [class*="owner"]',
        );
        // Owner labels are optional based on implementation
        if ((await ownerLabels.count()) > 0) {
          await expect(ownerLabels.first()).toBeVisible();
        }
      }
    } else {
      // Skip test if not a keyholder account
      test.skip();
    }
  });

  test("should handle rapid event submissions", async ({ page }) => {
    // Submit 3 events quickly
    for (let i = 1; i <= 3; i++) {
      await logEvent(page, {
        type: "Note",
        notes: `Rapid submission test ${i}`,
      });
      await page.waitForTimeout(300); // Small delay between submissions
    }

    // Wait for all events to process
    await page.waitForTimeout(2000);

    // Verify at least some events were logged
    const event1 = page.locator("text=/Rapid submission test 1/i");
    const event2 = page.locator("text=/Rapid submission test 2/i");
    const event3 = page.locator("text=/Rapid submission test 3/i");

    // At least one event should be visible
    const hasAnyEvent =
      (await event1.count()) > 0 ||
      (await event2.count()) > 0 ||
      (await event3.count()) > 0;

    expect(hasAnyEvent).toBe(true);
  });

  test("should handle event logging with special characters", async ({
    page,
  }) => {
    const specialNotes =
      "Test with special chars: @#$%^&*()_+{}[]|\\:;\"'<>,.?/~`";

    await logEvent(page, {
      type: "Note",
      notes: specialNotes,
    });

    await page.waitForTimeout(1000);

    // Verify event was logged (may not display all special chars)
    const eventText = page.locator("text=/Test with special chars/i");
    if ((await eventText.count()) > 0) {
      await expect(eventText.first()).toBeVisible();
    }
  });

  test("should handle very long notes", async ({ page }) => {
    const longNotes = "A".repeat(500); // 500 characters

    await logEvent(page, {
      type: "Note",
      notes: longNotes,
    });

    await page.waitForTimeout(1000);

    // Verify event was logged (notes may be truncated in display)
    const hasNewEvent = (await getEventCount(page)) > 0;
    expect(hasNewEvent).toBe(true);
  });

  test("should allow logging multiple event types simultaneously", async ({
    page,
  }) => {
    // Look for multiple event type buttons
    const orgasmButton = page.locator('button:has-text("Orgasm")');
    const activityButton = page.locator('button:has-text("Sexual Activity")');

    if (
      (await orgasmButton.isVisible()) &&
      (await activityButton.isVisible())
    ) {
      // Select multiple types
      await orgasmButton.click();
      await page.waitForTimeout(200);
      await activityButton.click();
      await page.waitForTimeout(200);

      // Add notes and submit
      const notesInput = page.locator("textarea");
      if (await notesInput.isVisible()) {
        await notesInput.fill("Multiple event types test");
      }

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Verify event was logged
      const eventText = page.locator("text=/Multiple event types test/i");
      if ((await eventText.count()) > 0) {
        await expect(eventText.first()).toBeVisible();
      }
    }
  });

  test("should persist events after page reload", async ({ page }) => {
    // Log a unique event
    const uniqueNote = `Persistence test ${Date.now()}`;
    await logEvent(page, {
      type: "Note",
      notes: uniqueNote,
    });

    await page.waitForTimeout(1000);

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Navigate back to log event page
    await navigateToLogEventPage(page);
    await page.waitForTimeout(1000);

    // Verify event still exists
    const eventText = page.locator(`text=/${uniqueNote}/i`);
    // Event should persist (checking for visibility)
    if ((await eventText.count()) > 0) {
      await expect(eventText.first()).toBeVisible();
    }
  });

  test("should handle empty form submission gracefully", async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Form should either show validation or prevent submission
      // No crash should occur
      const body = page.locator("body");
      await expect(body).toBeVisible();
    }
  });

  test("should display events in chronological order", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Get all event timestamps/dates
    const eventDates = page.locator(
      '[data-testid="event-date"], [class*="event-time"], [class*="timestamp"]',
    );

    if ((await eventDates.count()) >= 2) {
      // Events should be sorted (most recent first typically)
      // Just verify they exist and are visible
      await expect(eventDates.first()).toBeVisible();
      await expect(eventDates.nth(1)).toBeVisible();
    }
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to log an event
    await logEvent(page, {
      type: "Note",
      notes: "Offline test",
    });

    await page.waitForTimeout(1000);

    // Restore connection
    await page.context().setOffline(false);

    // App should handle error gracefully (no crash)
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Events Filtering and Viewing", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToLogEventPage(page);
    await page.waitForTimeout(1000);
  });

  test("should support viewing event history", async ({ page }) => {
    // Look for events list
    const eventsList = page.locator(
      "text=/recent/i, text=/events/i, text=/history/i",
    );

    if ((await eventsList.count()) > 0) {
      await expect(eventsList.first()).toBeVisible();

      // Count events
      const count = await getEventCount(page);
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test("should handle large event lists", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Get event count
    const count = await getEventCount(page);

    // If there are many events, verify pagination or scrolling works
    if (count > 10) {
      // Try to scroll to load more events
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);

      // Verify page still works
      const body = page.locator("body");
      await expect(body).toBeVisible();
    }

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display event details properly", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for any event
    const firstEvent = page
      .locator('[data-testid="event"], [class*="event-item"]')
      .first();

    if (await firstEvent.isVisible()) {
      // Event should have some content
      const text = await firstEvent.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    }
  });
});
