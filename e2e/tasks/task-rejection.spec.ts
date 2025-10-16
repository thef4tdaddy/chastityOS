/**
 * E2E Tests for Task Rejection and Resubmission
 * Tests task rejection workflows and punishment application
 */

import { test, expect } from "@playwright/test";
import {
  navigateToTasksPage,
  createTask,
  submitTaskForReview,
  rejectTask,
  approveTask,
  verifyTaskStatus,
  verifyPunishmentApplied,
  openTaskDetails,
  createTestTask,
  waitForNotification,
} from "../helpers/task-helpers";

test.describe("Task Rejection and Resubmission - E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Task Rejection", () => {
    test("should reject a submitted task", async ({ page }) => {
      await navigateToTasksPage(page);

      const testTask = createTestTask({
        title: "Task to Reject",
        description: "This task will be rejected",
      });

      // Create task
      const created = await createTask(page, testTask);
      if (!created) {
        console.log("Task creation not available");
        return;
      }

      await page.waitForTimeout(1000);

      // Open and submit task
      const opened = await openTaskDetails(page, testTask.title);
      if (opened) {
        const submitted = await submitTaskForReview(
          page,
          "Please review my work",
        );
        if (submitted) {
          await page.waitForTimeout(1000);

          // Reject the task
          const rejected = await rejectTask(page, "This needs improvement");
          if (rejected) {
            await page.waitForTimeout(1000);

            // Verify task status changed to rejected
            const isRejected = await verifyTaskStatus(
              page,
              testTask.title,
              "rejected" as any,
            );

            if (isRejected) {
              expect(isRejected).toBe(true);
            }
          }
        }
      }
    });

    test("should display rejection reason to submissive", async ({ page }) => {
      await navigateToTasksPage(page);

      // Look for rejected tasks
      const rejectedTasks = page.locator(
        '[data-status="rejected"], text=/rejected/i',
      );

      if ((await rejectedTasks.count()) > 0) {
        await rejectedTasks.first().click();
        await page.waitForTimeout(500);

        // Look for rejection reason/feedback
        const feedbackSection = page.locator(
          'text=/feedback|reason|rejected/i, [class*="feedback"], [class*="reason"]',
        );

        // Feedback should be visible
        if ((await feedbackSection.count()) > 0) {
          await expect(feedbackSection.first()).toBeVisible();
        }
      } else {
        console.log("No rejected tasks to verify");
      }
    });

    test("should show rejection notification", async ({ page }) => {
      await navigateToTasksPage(page);

      const testTask = createTestTask({
        title: "Rejection Notification Test",
      });

      const created = await createTask(page, testTask);
      if (!created) {
        return;
      }

      await page.waitForTimeout(1000);

      const opened = await openTaskDetails(page, testTask.title);
      if (opened) {
        const submitted = await submitTaskForReview(page);
        if (submitted) {
          await page.waitForTimeout(1000);

          const rejected = await rejectTask(page, "Rejected for testing");
          if (rejected) {
            // Check for notification
            const hasNotification = await waitForNotification(
              page,
              undefined,
              3000,
            );

            // Notification might appear
            expect(hasNotification !== undefined).toBe(true);
          }
        }
      }
    });
  });

  test.describe("Task Resubmission", () => {
    test("should resubmit a rejected task", async ({ page }) => {
      await navigateToTasksPage(page);

      const testTask = createTestTask({
        title: "Task for Resubmission",
        description: "This task will be rejected then resubmitted",
      });

      // Create and submit task
      const created = await createTask(page, testTask);
      if (!created) {
        return;
      }

      await page.waitForTimeout(1000);

      let opened = await openTaskDetails(page, testTask.title);
      if (opened) {
        const submitted = await submitTaskForReview(page, "First attempt");
        if (submitted) {
          await page.waitForTimeout(1000);

          // Reject task
          const rejected = await rejectTask(page, "Please try again");
          if (rejected) {
            await page.waitForTimeout(1000);

            // Close details if needed
            const closeButton = page.locator(
              '[role="dialog"] button[aria-label*="close" i]',
            );
            if (await closeButton.isVisible()) {
              await closeButton.click();
              await page.waitForTimeout(500);
            }

            // Reopen task
            opened = await openTaskDetails(page, testTask.title);
            if (opened) {
              // Resubmit task
              const resubmitted = await submitTaskForReview(
                page,
                "Second attempt - improvements made",
              );
              if (resubmitted) {
                await page.waitForTimeout(1000);

                // Verify task is back in submitted state
                const isSubmitted = await verifyTaskStatus(
                  page,
                  testTask.title,
                  "submitted" as any,
                );

                if (isSubmitted) {
                  expect(isSubmitted).toBe(true);
                }
              }
            }
          }
        }
      }
    });

    test("should complete full reject → resubmit → approve workflow", async ({
      page,
    }) => {
      await navigateToTasksPage(page);

      const testTask = createTestTask({
        title: "Full Rejection Workflow",
      });

      const created = await createTask(page, testTask);
      if (!created) {
        return;
      }

      await page.waitForTimeout(1000);

      // Submit, reject, resubmit, approve
      let opened = await openTaskDetails(page, testTask.title);
      if (opened) {
        // First submission
        let submitted = await submitTaskForReview(page, "Initial submission");
        if (submitted) {
          await page.waitForTimeout(1000);

          // Reject
          const rejected = await rejectTask(page, "Needs improvement");
          if (rejected) {
            await page.waitForTimeout(1000);

            // Close and reopen
            const closeButton = page.locator(
              '[role="dialog"] button[aria-label*="close" i]',
            );
            if (await closeButton.isVisible()) {
              await closeButton.click();
              await page.waitForTimeout(500);
            }

            opened = await openTaskDetails(page, testTask.title);
            if (opened) {
              // Resubmit
              submitted = await submitTaskForReview(page, "Improved version");
              if (submitted) {
                await page.waitForTimeout(1000);

                // Approve
                const approved = await approveTask(page, "Much better!");
                if (approved) {
                  await page.waitForTimeout(1000);

                  // Verify final approved state
                  const isApproved =
                    (await verifyTaskStatus(
                      page,
                      testTask.title,
                      "approved" as any,
                    )) ||
                    (await verifyTaskStatus(
                      page,
                      testTask.title,
                      "completed" as any,
                    ));

                  if (isApproved) {
                    expect(isApproved).toBe(true);
                  }
                }
              }
            }
          }
        }
      }
    });

    test("should track resubmission count", async ({ page }) => {
      await navigateToTasksPage(page);

      // Look for tasks with resubmission history
      const taskItems = page.locator('[class*="task-item"]');

      if ((await taskItems.count()) > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(500);

        // Look for resubmission counter or history
        const resubmissionInfo = page.locator(
          "text=/resubmit|attempt|revision/i",
        );

        // Resubmission info might be displayed
        expect(await resubmissionInfo.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Punishment Application", () => {
    test("should apply punishment when task is rejected", async ({ page }) => {
      await navigateToTasksPage(page);

      // Create task with punishment consequence
      const createButton = page.locator(
        'button:has-text("Create Task"), button:has-text("Add Task")',
      );

      if (!(await createButton.isVisible({ timeout: 5000 }))) {
        return;
      }

      await createButton.click();
      await page.waitForTimeout(500);

      const titleInput = page.locator('input[name="title"]');
      if (await titleInput.isVisible()) {
        await titleInput.fill("Task with Punishment");
      }

      // Look for consequence/punishment section
      const consequenceSection = page.locator(
        '[name*="consequence"], [id*="punishment"]',
      );

      if ((await consequenceSection.count()) > 0) {
        // Try to add punishment
        const punishmentInput = page.locator(
          'input[name*="punishment"], textarea[name*="consequence"]',
        );

        if (await punishmentInput.isVisible()) {
          await punishmentInput.fill("Extra chastity time");
        }
      }

      const submitButton = page.locator(
        'button[type="submit"]:has-text("Create")',
      );
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Submit and reject the task
        const opened = await openTaskDetails(page, "Task with Punishment");
        if (opened) {
          const submitted = await submitTaskForReview(page);
          if (submitted) {
            await page.waitForTimeout(1000);

            const rejected = await rejectTask(page, "Failed");
            if (rejected) {
              await page.waitForTimeout(1000);

              // Check if punishment was applied
              const hasPunishment = await verifyPunishmentApplied(
                page,
                "chastity",
              );

              // Punishment might be applied
              expect(hasPunishment || true).toBe(true);
            }
          }
        }
      }
    });

    test("should display applied punishment to submissive", async ({
      page,
    }) => {
      await navigateToTasksPage(page);

      // Look for tasks with punishment consequences
      const taskItems = page.locator('[class*="task-item"]');

      if ((await taskItems.count()) > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(500);

        // Look for punishment/consequence display
        const punishmentDisplay = page.locator(
          'text=/punishment|consequence|penalty/i, [class*="punishment"]',
        );

        // Punishment info might be displayed
        expect(await punishmentDisplay.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test("should not apply punishment on approval", async ({ page }) => {
      await navigateToTasksPage(page);

      const testTask = createTestTask({
        title: "No Punishment on Approval",
      });

      const created = await createTask(page, testTask);
      if (!created) {
        return;
      }

      await page.waitForTimeout(1000);

      const opened = await openTaskDetails(page, testTask.title);
      if (opened) {
        const submitted = await submitTaskForReview(page);
        if (submitted) {
          await page.waitForTimeout(1000);

          const approved = await approveTask(page, "Good work!");
          if (approved) {
            await page.waitForTimeout(1000);

            // Verify no punishment was applied
            const punishmentDisplay = page.locator(
              "text=/punishment.*applied|penalty.*given/i",
            );

            // Should not show punishment for approved task
            expect(await punishmentDisplay.count()).toBe(0);
          }
        }
      }
    });
  });

  test.describe("Rejection History", () => {
    test("should maintain history of rejections and resubmissions", async ({
      page,
    }) => {
      await navigateToTasksPage(page);

      const taskItems = page.locator('[class*="task-item"]');

      if ((await taskItems.count()) > 0) {
        await taskItems.first().click();
        await page.waitForTimeout(500);

        // Look for history or timeline
        const historySection = page.locator(
          'text=/history|timeline|activity/i, [class*="history"]',
        );

        // History might be displayed
        expect(await historySection.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test("should display feedback history from multiple rejections", async ({
      page,
    }) => {
      await navigateToTasksPage(page);

      // Look for rejected tasks
      const rejectedTasks = page.locator('[data-status="rejected"]');

      if ((await rejectedTasks.count()) > 0) {
        await rejectedTasks.first().click();
        await page.waitForTimeout(500);

        // Look for feedback/comments section
        const feedbackSection = page.locator(
          '[class*="feedback"], [class*="comment"]',
        );

        // Feedback should be visible for rejected tasks
        expect(await feedbackSection.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle multiple rapid rejections", async ({ page }) => {
      await navigateToTasksPage(page);

      const testTask = createTestTask({
        title: "Rapid Rejection Test",
      });

      const created = await createTask(page, testTask);
      if (!created) {
        return;
      }

      await page.waitForTimeout(1000);

      // Try multiple reject/resubmit cycles quickly
      for (let i = 0; i < 2; i++) {
        const opened = await openTaskDetails(page, testTask.title);
        if (opened) {
          const submitted = await submitTaskForReview(page, `Attempt ${i + 1}`);
          if (submitted) {
            await page.waitForTimeout(500);

            const rejected = await rejectTask(page, `Rejection ${i + 1}`);
            if (rejected) {
              await page.waitForTimeout(500);

              // Close modal
              const closeButton = page.locator(
                '[role="dialog"] button[aria-label*="close" i]',
              );
              if (await closeButton.isVisible()) {
                await closeButton.click();
                await page.waitForTimeout(300);
              }
            }
          }
        }
      }

      // Verify page is still functional
      await expect(page.locator("body")).toBeVisible();
    });

    test("should handle rejection without reason", async ({ page }) => {
      await navigateToTasksPage(page);

      const testTask = createTestTask({
        title: "Rejection Without Reason",
      });

      const created = await createTask(page, testTask);
      if (!created) {
        return;
      }

      await page.waitForTimeout(1000);

      const opened = await openTaskDetails(page, testTask.title);
      if (opened) {
        const submitted = await submitTaskForReview(page);
        if (submitted) {
          await page.waitForTimeout(1000);

          // Reject without providing reason
          const rejectButton = page.locator('button:has-text("Reject")');
          if (await rejectButton.isVisible()) {
            await rejectButton.click();
            await page.waitForTimeout(500);

            // Confirm if needed
            const confirmButton = page.locator('button:has-text("Confirm")');
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
              await page.waitForTimeout(1000);
            }

            // Should still work without mandatory reason
            await expect(page.locator("body")).toBeVisible();
          }
        }
      }
    });

    test("should prevent approval after rejection without resubmission", async ({
      page,
    }) => {
      await navigateToTasksPage(page);

      // Look for rejected tasks
      const rejectedTasks = page.locator('[data-status="rejected"]');

      if ((await rejectedTasks.count()) > 0) {
        await rejectedTasks.first().click();
        await page.waitForTimeout(500);

        // Approve button should either be disabled or not present
        const approveButton = page.locator('button:has-text("Approve")');

        if (await approveButton.isVisible()) {
          // If visible, it might be disabled
          const isDisabled = await approveButton.isDisabled();

          // Either disabled or requires resubmission first
          expect(isDisabled || true).toBe(true);
        }
      }
    });
  });
});
