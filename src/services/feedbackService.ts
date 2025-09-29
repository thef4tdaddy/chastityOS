// src/services/feedbackService.ts

import axios from "axios";
import type { FeedbackData } from "../types/feedback";
import { serviceLogger } from "../utils/logging";

// GitHub Issues API data structure
interface GitHubIssueData {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

export class FeedbackService {
  private static logger = serviceLogger("FeedbackService");

  // Submit to GitHub Issues (or other bug tracking system)
  static async submitFeedback(feedback: FeedbackData): Promise<void> {
    try {
      // For GitHub Issues integration
      const issueData = {
        title: `[USER FEEDBACK] ${feedback.title}`,
        body: this.formatFeedbackForGitHub(feedback),
        labels: this.getLabelsForFeedback(feedback),
      };

      // Submit to GitHub if credentials are available
      await this.submitToGitHub(issueData);

      // Submit to Discord webhook if available
      await this.submitToDiscord(feedback);

      // Also store locally for analytics
      await this.storeLocalFeedback(feedback);
    } catch (error) {
      this.logger.error("Failed to submit feedback", error);

      // Store locally if submission fails
      await this.storeLocalFeedback(feedback);
      throw new Error(
        "Feedback submission failed. We've saved it locally and will retry.",
      );
    }
  }

  private static formatFeedbackForGitHub(feedback: FeedbackData): string {
    return `
## ${feedback.type.toUpperCase()}: ${feedback.title}

**Description:**
${feedback.description}

${
  feedback.type === "bug"
    ? `
**Steps to Reproduce:**
${feedback.steps || "Not provided"}

**Expected Behavior:**
${feedback.expected || "Not provided"}

**Actual Behavior:**
${feedback.actual || "Not provided"}

**Priority:** ${feedback.priority}
`
    : ""
}

${
  feedback.systemInfo
    ? `
**System Information:**
- User Agent: ${feedback.systemInfo.userAgent}
- Platform: ${feedback.systemInfo.platform}
- Screen: ${feedback.systemInfo.screenResolution}
- Viewport: ${feedback.systemInfo.viewportSize}
- Timezone: ${feedback.systemInfo.timezone}
- URL: ${feedback.systemInfo.url}
- Language: ${feedback.systemInfo.language}
- Features: localStorage(${feedback.systemInfo.localStorage}), sessionStorage(${feedback.systemInfo.sessionStorage}), indexedDB(${feedback.systemInfo.indexedDB}), serviceWorker(${feedback.systemInfo.serviceWorker})
`
    : ""
}

**Contact:** ${feedback.contactEmail || "Not provided"}
**Timestamp:** ${feedback.timestamp.toISOString()}
    `.trim();
  }

  private static getLabelsForFeedback(feedback: FeedbackData): string[] {
    const labels = ["user-feedback"];

    switch (feedback.type) {
      case "bug":
        labels.push("bug");
        if (feedback.priority === "high") labels.push("priority-high");
        if (feedback.priority === "low") labels.push("priority-low");
        break;
      case "feature":
        labels.push("enhancement");
        break;
      case "general":
        labels.push("feedback");
        break;
    }

    return labels;
  }

  private static async submitToGitHub(
    issueData: GitHubIssueData,
  ): Promise<void> {
    const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
    const githubRepo = import.meta.env.VITE_GITHUB_REPO;

    if (!githubRepo || !githubToken) {
      this.logger.warn(
        "GitHub environment variables are missing. Skipping GitHub issue creation.",
      );
      return;
    }

    const response = await axios.post(
      `https://api.github.com/repos/${githubRepo}/issues`,
      issueData,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    this.logger.info("GitHub issue created", { url: response.data.html_url });
  }

  private static async submitToDiscord(feedback: FeedbackData): Promise<void> {
    const webhookUrl =
      feedback.type === "bug"
        ? import.meta.env.VITE_DISCORD_WEBHOOK_BUG
        : import.meta.env.VITE_DISCORD_WEBHOOK_SUGGESTION;

    if (!webhookUrl) {
      this.logger.warn(
        "Discord webhook URL not configured. Skipping Discord notification.",
      );
      return;
    }

    const appVersion = `${import.meta.env.VITE_APP_VERSION || "dev"} (${import.meta.env.VITE_ENV || "local"})`;

    const discordPayload = {
      content: `**New ${feedback.type.toUpperCase()}**\n${feedback.title}\n\n${feedback.description}\n\n**Contact:** ${feedback.contactEmail || "N/A"}\n**App Version:** ${appVersion}\n**Time:** ${feedback.timestamp.toISOString()}\n**Priority:** ${feedback.priority}`,
    };

    await axios.post(webhookUrl, discordPayload);
    this.logger.info("Discord notification sent");
  }

  private static async storeLocalFeedback(
    feedback: FeedbackData,
  ): Promise<void> {
    try {
      const stored = JSON.parse(
        localStorage.getItem("pendingFeedback") || "[]",
      );
      stored.push({
        ...feedback,
        timestamp: feedback.timestamp.toISOString(),
        localStorageId: Date.now(),
      });
      localStorage.setItem("pendingFeedback", JSON.stringify(stored));
      this.logger.info("Feedback stored locally");
    } catch (error) {
      this.logger.error("Failed to store feedback locally", error);
    }
  }
}
