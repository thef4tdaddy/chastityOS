#!/usr/bin/env node

/**
 * Discord Webhook Reporter for CI/CD Notifications
 * Sends formatted notifications about performance and code quality
 */

const https = require("https");
const url = require("url");

class DiscordReporter {
  constructor(webhookUrl = process.env.DISCORD_WEBHOOK_URL) {
    if (!webhookUrl) {
      console.log("⚠️ DISCORD_WEBHOOK_URL not configured");
      this.webhookUrl = null;
      return;
    }

    this.webhookUrl = webhookUrl;
    this.webhookParts = url.parse(webhookUrl);
  }

  async sendEmbed(embed) {
    if (!this.webhookUrl) {
      console.log("ℹ️ Discord webhook not configured, skipping notification");
      return;
    }

    const payload = {
      username: embed.username || "ChastityOS CI",
      avatar_url: embed.avatarUrl,
      embeds: [embed.embed],
    };

    return this.sendWebhook(payload);
  }

  async sendWebhook(payload) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);

      const options = {
        hostname: this.webhookParts.hostname,
        port: 443,
        path: this.webhookParts.path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = "";

        res.on("data", (chunk) => {
          responseData += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("✅ Discord notification sent successfully");
            resolve(responseData);
          } else {
            console.error(
              `❌ Discord webhook failed: ${res.statusCode} ${responseData}`,
            );
            resolve(); // Don't reject to avoid failing CI
          }
        });
      });

      req.on("error", (error) => {
        console.error("❌ Discord webhook error:", error.message);
        resolve(); // Don't reject to avoid failing CI
      });

      req.write(postData);
      req.end();
    });
  }

  createPerformanceEmbed(data) {
    const {
      overallScore,
      performanceScore,
      firstContentfulPaint,
      largestContentfulPaint,
      cumulativeLayoutShift,
      timeToInteractive,
      branch,
      commit,
      trend,
      isRegression = false,
    } = data;

    const scoreColor = isRegression
      ? 15158332 // Red for regression
      : overallScore >= 0.9
        ? 3066993 // Green for excellent
        : overallScore >= 0.8
          ? 15844367 // Yellow for good
          : 15158332; // Red for poor

    const statusEmoji = isRegression
      ? "⚠️"
      : overallScore >= 0.9
        ? "🚀"
        : overallScore >= 0.8
          ? "✅"
          : "❌";

    const title = isRegression
      ? `${statusEmoji} Performance Regression Detected`
      : `${statusEmoji} Performance Report`;

    const description = isRegression
      ? `Performance has regressed by ${Math.abs(trend * 100).toFixed(1)}%`
      : `Overall performance score: ${(overallScore * 100).toFixed(0)}%`;

    return {
      username: "Lighthouse Performance Bot",
      avatarUrl:
        "https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/assets/lighthouse-logo.png",
      embed: {
        title,
        description,
        color: scoreColor,
        fields: [
          {
            name: "📊 Performance Score",
            value: `${(performanceScore * 100).toFixed(0)}%`,
            inline: true,
          },
          {
            name: "🎯 Overall Score",
            value: `${(overallScore * 100).toFixed(0)}%`,
            inline: true,
          },
          {
            name: "⚡ First Contentful Paint",
            value: `${firstContentfulPaint}ms`,
            inline: true,
          },
          {
            name: "🖼️ Largest Contentful Paint",
            value: `${largestContentfulPaint}ms`,
            inline: true,
          },
          {
            name: "📐 Cumulative Layout Shift",
            value: cumulativeLayoutShift?.toFixed(3) || "N/A",
            inline: true,
          },
          {
            name: "🔄 Time to Interactive",
            value: `${timeToInteractive}ms`,
            inline: true,
          },
          {
            name: "🌿 Branch",
            value: branch,
            inline: true,
          },
          {
            name: "📝 Commit",
            value: `[${commit.slice(0, 7)}](https://github.com/${process.env.GITHUB_REPOSITORY}/commit/${commit})`,
            inline: true,
          },
        ],
        footer: {
          text: "Lighthouse CI • ChastityOS Performance Monitoring",
          icon_url:
            "https://raw.githubusercontent.com/GoogleChrome/lighthouse/main/assets/lighthouse-logo.png",
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  createCodeQualityEmbed(data) {
    const {
      qualityScore,
      totalErrors,
      totalWarnings,
      totalFiles,
      filesWithIssues,
      topRules,
      branch,
      commit,
      trend,
      isRegression = false,
    } = data;

    const scoreColor = isRegression
      ? 15158332 // Red for regression
      : qualityScore >= 90
        ? 3066993 // Green for excellent
        : qualityScore >= 80
          ? 15844367 // Yellow for good
          : qualityScore >= 70
            ? 16753920 // Orange for fair
            : 15158332; // Red for poor

    const statusEmoji = isRegression
      ? "🚨"
      : qualityScore >= 90
        ? "🎯"
        : qualityScore >= 80
          ? "✅"
          : qualityScore >= 70
            ? "⚠️"
            : "❌";

    const title = isRegression
      ? `${statusEmoji} Code Quality Regression Detected`
      : `${statusEmoji} Code Quality Report`;

    const description = isRegression
      ? `Code quality has declined by ${Math.abs(trend).toFixed(1)} points`
      : `Quality score: ${qualityScore.toFixed(1)}/100`;

    const topRulesList =
      topRules
        ?.slice(0, 3)
        .map(
          ([rule, count]) =>
            `• **${rule}**: ${count} violation${count > 1 ? "s" : ""}`,
        )
        .join("\n") || "No major violations";

    return {
      username: "ESLint Quality Bot",
      avatarUrl: "https://eslint.org/assets/img/favicon.512x512.png",
      embed: {
        title,
        description,
        color: scoreColor,
        fields: [
          {
            name: "📊 Quality Score",
            value: `${qualityScore.toFixed(1)}/100`,
            inline: true,
          },
          {
            name: "❌ Errors",
            value: totalErrors.toString(),
            inline: true,
          },
          {
            name: "⚠️ Warnings",
            value: totalWarnings.toString(),
            inline: true,
          },
          {
            name: "📁 Files Affected",
            value: `${filesWithIssues}/${totalFiles}`,
            inline: true,
          },
          {
            name: "📈 Error Rate",
            value: `${((totalErrors / totalFiles) * 100).toFixed(1)}%`,
            inline: true,
          },
          {
            name: "📋 Top Violations",
            value: topRulesList,
            inline: false,
          },
          {
            name: "🌿 Branch",
            value: branch,
            inline: true,
          },
          {
            name: "📝 Commit",
            value: `[${commit.slice(0, 7)}](https://github.com/${process.env.GITHUB_REPOSITORY}/commit/${commit})`,
            inline: true,
          },
        ],
        footer: {
          text: "ESLint • ChastityOS Code Quality Monitoring",
          icon_url: "https://eslint.org/assets/img/favicon.512x512.png",
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  createWeeklyReportEmbed(trendData) {
    const { performance, quality, generatedAt } = trendData;

    const getTrendEmoji = (trend) => {
      switch (trend) {
        case "improving":
          return "📈";
        case "declining":
          return "📉";
        case "stable":
          return "➡️";
        default:
          return "❓";
      }
    };

    const getTrendColor = (perfTrend, qualTrend) => {
      if (perfTrend === "improving" && qualTrend === "improving")
        return 3066993; // Green
      if (perfTrend === "declining" || qualTrend === "declining")
        return 15158332; // Red
      return 15844367; // Yellow
    };

    return {
      username: "ChastityOS Weekly Report",
      embed: {
        title: "📊 Weekly Quality & Performance Report",
        description: "Automated analysis of project health trends",
        color: getTrendColor(performance.trend, quality.trend),
        fields: [
          {
            name: `${getTrendEmoji(performance.trend)} Performance Trend`,
            value:
              `**${performance.trend.toUpperCase()}**\n` +
              `Change: ${performance.change > 0 ? "+" : ""}${performance.change}%\n` +
              `Current Avg: ${performance.recentAverage}%\n` +
              `Previous Avg: ${performance.previousAverage}%`,
            inline: true,
          },
          {
            name: `${getTrendEmoji(quality.trend)} Quality Trend`,
            value:
              `**${quality.trend.toUpperCase()}**\n` +
              `Change: ${quality.change > 0 ? "+" : ""}${quality.change} pts\n` +
              `Current Avg: ${quality.recentAverage}/100\n` +
              `Previous Avg: ${quality.previousAverage}/100`,
            inline: true,
          },
          {
            name: "📅 Analysis Period",
            value: "Last 7 days vs Previous 7 days",
            inline: false,
          },
          {
            name: "🔗 Quick Links",
            value:
              "[Performance Dashboard](https://sheets.google.com) • [Quality Dashboard](https://sheets.google.com) • [GitHub Issues](https://github.com/thef4tdaddy/chastityOS/issues)",
            inline: false,
          },
        ],
        footer: {
          text: "Weekly Automated Report • ChastityOS",
        },
        timestamp: generatedAt,
      },
    };
  }

  async sendPerformanceNotification(data) {
    const embed = this.createPerformanceEmbed(data);
    return this.sendEmbed(embed);
  }

  async sendCodeQualityNotification(data) {
    const embed = this.createCodeQualityEmbed(data);
    return this.sendEmbed(embed);
  }

  async sendWeeklyReport(trendData) {
    const embed = this.createWeeklyReportEmbed(trendData);
    return this.sendEmbed(embed);
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const reporter = new DiscordReporter();

  try {
    switch (command) {
      case "performance":
        const perfData = JSON.parse(process.argv[3]);
        await reporter.sendPerformanceNotification(perfData);
        break;

      case "quality":
        const qualityData = JSON.parse(process.argv[3]);
        await reporter.sendCodeQualityNotification(qualityData);
        break;

      case "weekly-report":
        const reportData = JSON.parse(process.argv[3]);
        await reporter.sendWeeklyReport(reportData);
        break;

      default:
        console.log(
          "Usage: node discord-reporter.js <performance|quality|weekly-report> <data>",
        );
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Discord reporter error:", error.message);
    // Exit with 0 to avoid failing CI for notification issues
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = DiscordReporter;
