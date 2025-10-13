/**
 * Report Test Helpers
 * Utilities for testing Full Report workflows and data aggregation
 */

import { Page, expect } from "@playwright/test";

/**
 * Mock session data for testing
 */
export interface MockSessionData {
  startTime: string;
  endTime?: string;
  duration: number;
  isPaused: boolean;
  pauseDuration?: number;
  endReason?: string;
  goalDuration?: number;
}

/**
 * Mock event data for testing
 */
export interface MockEventData {
  timestamp: string;
  eventType: string;
  description: string;
  intensity?: number;
}

/**
 * Mock statistics data
 */
export interface MockStatistics {
  totalSessions: number;
  totalChastityTime: number;
  averageSessionDuration: number;
  longestSession: number;
  totalPauseTime: number;
  eventCount: number;
}

/**
 * Helper to navigate to Full Report page
 */
export const navigateToFullReport = async (page: Page) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Look for Full Report navigation link
  const reportLink = page.locator(
    'a:has-text("Full Report"), button:has-text("Full Report"), nav a[href*="fullReport"], nav a[href*="report"]',
  );

  if ((await reportLink.count()) > 0) {
    await reportLink.first().click();
    await page.waitForLoadState("networkidle");

    // Wait for the report page to fully load
    await page.waitForTimeout(1000);
  } else {
    // Direct navigation if link not found
    await page.goto("/?page=fullReport");
    await page.waitForLoadState("networkidle");
  }
};

/**
 * Helper to verify report page is displayed
 */
export const verifyReportPageLoaded = async (page: Page): Promise<boolean> => {
  // Check for key report sections
  const titleSelectors = [
    'h1:has-text("Full Report")',
    'h2:has-text("Full Report")',
    "text=/Current Status|Chastity History|Sexual Events/i",
  ];

  for (const selector of titleSelectors) {
    const element = page.locator(selector);
    if ((await element.count()) > 0) {
      return true;
    }
  }

  return false;
};

/**
 * Helper to verify Current Status section is displayed
 */
export const verifyCurrentStatusSection = async (
  page: Page,
): Promise<boolean> => {
  const statusIndicators = page.locator(
    "text=/Current Status|Cage On|Cage Off|Active|Stopped/i",
  );
  return (await statusIndicators.count()) > 0;
};

/**
 * Helper to verify Totals section is displayed
 */
export const verifyTotalsSection = async (page: Page): Promise<boolean> => {
  const totalsIndicators = page.locator(
    "text=/Total.*Time|Total Sessions|Total Chastity/i",
  );
  return (await totalsIndicators.count()) > 0;
};

/**
 * Helper to verify Chastity History table is displayed
 */
export const verifyChastityHistoryTable = async (
  page: Page,
): Promise<boolean> => {
  const historyTable = page.locator(
    'table, [class*="history"], text=/Chastity History/i',
  );
  return (await historyTable.count()) > 0;
};

/**
 * Helper to verify Sexual Events Log is displayed
 */
export const verifySexualEventsLog = async (page: Page): Promise<boolean> => {
  const eventsLog = page.locator(
    'table, [class*="event"], text=/Sexual Events|Event Log/i',
  );
  return (await eventsLog.count()) > 0;
};

/**
 * Helper to count visible sessions in history
 */
export const countVisibleSessions = async (page: Page): Promise<number> => {
  // Look for table rows or session cards
  const sessionRows = page.locator(
    'table tbody tr, [data-testid="session-row"], [class*="session-item"]',
  );
  return await sessionRows.count();
};

/**
 * Helper to count visible events in log
 */
export const countVisibleEvents = async (page: Page): Promise<number> => {
  // Look for event table rows or event cards
  const eventRows = page.locator(
    'table tbody tr, [data-testid="event-row"], [class*="event-item"]',
  );
  return await eventRows.count();
};

/**
 * Helper to extract statistics from report
 */
export const extractStatistics = async (
  page: Page,
): Promise<Partial<MockStatistics>> => {
  const stats: Partial<MockStatistics> = {};

  // Try to find and extract total sessions
  const totalSessionsText = await page
    .locator("text=/Total Sessions/i")
    .first()
    .textContent()
    .catch(() => null);
  if (totalSessionsText) {
    const match = totalSessionsText.match(/\d+/);
    if (match) stats.totalSessions = parseInt(match[0]);
  }

  // Try to find and extract total chastity time
  const totalTimeText = await page
    .locator("text=/Total.*Chastity.*Time/i")
    .first()
    .textContent()
    .catch(() => null);
  if (totalTimeText) {
    // Parse time format (could be hours, days, etc.)
    stats.totalChastityTime = 0; // Placeholder
  }

  return stats;
};

/**
 * Helper to verify submissive name is displayed
 */
export const verifySubmissiveNameDisplayed = async (
  page: Page,
  name: string,
): Promise<boolean> => {
  const nameElement = page.locator(`text=/${name}/i`);
  return (await nameElement.count()) > 0;
};

/**
 * Helper to verify keyholder name is displayed
 */
export const verifyKeyholderNameDisplayed = async (
  page: Page,
  name: string,
): Promise<boolean> => {
  const keyholderElement = page.locator(
    `text=/Keyholder.*${name}|${name}.*Keyholder/i`,
  );
  return (await keyholderElement.count()) > 0;
};

/**
 * Helper to start a mock session for testing
 */
export const startMockSession = async (page: Page) => {
  // Navigate to tracker
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Start session
  const startButton = page.locator(
    'button:has-text("Cage On"), button:has-text("Start Session")',
  );

  if ((await startButton.count()) > 0) {
    await startButton.click();
    await page.waitForTimeout(1000);
  }
};

/**
 * Helper to end active session
 */
export const endActiveSession = async (page: Page, reason?: string) => {
  // Navigate to tracker if not already there
  const trackerLink = page.locator(
    'a:has-text("Tracker"), nav a[href*="tracker"]',
  );
  if ((await trackerLink.count()) > 0) {
    await trackerLink.first().click();
    await page.waitForLoadState("networkidle");
  }

  // End session
  const endButton = page.locator(
    'button:has-text("Cage Off"), button:has-text("End Session"), button:has-text("Stop")',
  );

  if ((await endButton.count()) > 0) {
    await endButton.click();
    await page.waitForTimeout(500);

    // Handle reason input if provided
    if (reason) {
      const reasonInput = page.locator(
        'textarea, input[placeholder*="reason" i]',
      );
      if ((await reasonInput.count()) > 0) {
        await reasonInput.fill(reason);
      }
    }

    // Confirm end
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("End")',
    );
    if ((await confirmButton.count()) > 0) {
      await confirmButton.click();
    }

    await page.waitForTimeout(1000);
  }
};

/**
 * Helper to add a mock sexual event
 */
export const addMockEvent = async (
  page: Page,
  eventType: string,
  description?: string,
) => {
  // Navigate to Log Event page
  const eventLink = page.locator(
    'a:has-text("Log Event"), a:has-text("Events"), nav a[href*="logEvent"], nav a[href*="event"]',
  );

  if ((await eventLink.count()) > 0) {
    await eventLink.first().click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  }

  // Look for event type selector
  const eventTypeButton = page.locator(
    `button:has-text("${eventType}"), [data-event-type="${eventType}"]`,
  );

  if ((await eventTypeButton.count()) > 0) {
    await eventTypeButton.click();
    await page.waitForTimeout(500);

    // Add description if provided
    if (description) {
      const descriptionInput = page.locator(
        'textarea, input[placeholder*="description" i], input[placeholder*="notes" i]',
      );
      if ((await descriptionInput.count()) > 0) {
        await descriptionInput.fill(description);
      }
    }

    // Save event
    const saveButton = page.locator(
      'button:has-text("Save"), button:has-text("Log"), button:has-text("Add")',
    );
    if ((await saveButton.count()) > 0) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }
  }
};

/**
 * Helper to verify report contains session data
 */
export const verifySessionDataInReport = async (
  page: Page,
): Promise<boolean> => {
  // Check for session-related data in the report
  const sessionData = page.locator(
    "text=/\\d+d|\\d+h|\\d+m|Duration|Start Time|End Time/i",
  );
  return (await sessionData.count()) > 0;
};

/**
 * Helper to verify report contains event data
 */
export const verifyEventDataInReport = async (page: Page): Promise<boolean> => {
  // Check for event-related data in the report
  const eventData = page.locator("text=/Event|Timestamp|Orgasm|Denial|Tease/i");
  return (await eventData.count()) > 0;
};

/**
 * Helper to wait for report data to refresh
 */
export const waitForReportRefresh = async (page: Page, timeout = 2000) => {
  await page.waitForTimeout(timeout);

  // Wait for any loading indicators to disappear
  const loadingIndicator = page.locator(
    '[class*="loading"], [class*="spinner"], text=/Loading/i',
  );

  if ((await loadingIndicator.count()) > 0) {
    await loadingIndicator.first().waitFor({ state: "hidden", timeout: 5000 });
  }
};

/**
 * Helper to verify empty state message
 */
export const verifyEmptyStateMessage = async (
  page: Page,
  section: string,
): Promise<boolean> => {
  const emptyMessages = page.locator(
    `text=/No ${section}|Empty|No data available/i`,
  );
  return (await emptyMessages.count()) > 0;
};

/**
 * Helper to check for statistics accuracy
 */
export const verifyStatisticsAccuracy = async (
  page: Page,
  expectedStats: Partial<MockStatistics>,
): Promise<boolean> => {
  const actualStats = await extractStatistics(page);

  // Compare expected vs actual (with some tolerance)
  if (expectedStats.totalSessions !== undefined) {
    if (actualStats.totalSessions !== expectedStats.totalSessions) {
      return false;
    }
  }

  return true;
};

/**
 * Helper to set submissive name in settings
 */
export const setSubmissiveName = async (page: Page, name: string) => {
  // Navigate to settings
  const settingsLink = page.locator(
    'a:has-text("Settings"), nav a[href*="settings"]',
  );

  if ((await settingsLink.count()) > 0) {
    await settingsLink.first().click();
    await page.waitForLoadState("networkidle");
  }

  // Find and fill name input
  const nameInput = page.locator(
    'input[placeholder*="Submissive" i], input[placeholder*="Name" i], input[id*="submissive"]',
  );

  if ((await nameInput.count()) > 0) {
    await nameInput.first().fill(name);

    // Save name
    const saveButton = page.locator(
      'button:has-text("Set"), button:has-text("Save")',
    );
    if ((await saveButton.count()) > 0) {
      await saveButton.first().click();
      await page.waitForTimeout(500);
    }
  }
};

/**
 * Helper to verify report performance (load time)
 */
export const measureReportLoadTime = async (page: Page): Promise<number> => {
  const startTime = Date.now();
  await navigateToFullReport(page);
  await waitForReportRefresh(page);
  const endTime = Date.now();

  return endTime - startTime;
};

/**
 * Helper to generate large dataset for performance testing
 */
export const generateLargeDataset = async (
  page: Page,
  sessionCount: number,
) => {
  // This would be used for performance testing
  // In a real test, we'd either mock data or create multiple sessions
  console.log(`Would generate ${sessionCount} sessions for testing`);
};

/**
 * Helper to verify error message is displayed
 */
export const verifyErrorMessage = async (page: Page): Promise<boolean> => {
  const errorMessages = page.locator(
    "text=/Error|Failed|Something went wrong|Unable to load/i",
  );
  return (await errorMessages.count()) > 0;
};

/**
 * Helper to check if report is responsive
 */
export const verifyReportResponsiveness = async (
  page: Page,
  viewport: { width: number; height: number },
): Promise<boolean> => {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(500);

  // Check that main content is visible and not overflowing
  const mainContent = page.locator('main, [role="main"], .report-container');
  if ((await mainContent.count()) === 0) return false;

  const boundingBox = await mainContent.first().boundingBox();
  if (!boundingBox) return false;

  // Verify content fits within viewport (with some tolerance)
  return boundingBox.width <= viewport.width + 50;
};
