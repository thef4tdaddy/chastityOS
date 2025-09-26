#!/usr/bin/env node

/**
 * Google Sheets API Helper for CI/CD Reporting
 * Handles writing performance and code quality data to Google Sheets
 */

const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

class SheetsReporter {
  constructor() {
    this.serviceAccountAuth = new JWT({
      email: process.env.GSHEET_CLIENT_EMAIL,
      key: process.env.GSHEET_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/spreadsheets"],
    });
  }

  async initSheet(spreadsheetId) {
    const doc = new GoogleSpreadsheet(spreadsheetId, this.serviceAccountAuth);
    await doc.loadInfo();
    return doc;
  }

  async ensureWorksheet(doc, title, headers) {
    let sheet;
    try {
      sheet = doc.sheetsByTitle[title];
      if (!sheet) {
        sheet = await doc.addSheet({
          title,
          headerValues: headers,
        });
      }
    } catch (error) {
      console.log(`Creating new worksheet: ${title}`);
      sheet = await doc.addSheet({
        title,
        headerValues: headers,
      });
    }

    await sheet.loadHeaderRow();

    // Ensure headers match expected format
    if (sheet.headerValues.length === 0) {
      await sheet.setHeaderRow(headers);
    }

    return sheet;
  }

  async addPerformanceData(data) {
    try {
      const spreadsheetId = process.env.LIGHTHOUSE_SPREADSHEET_ID;
      if (!spreadsheetId) {
        console.log("⚠️ LIGHTHOUSE_SPREADSHEET_ID not configured");
        return;
      }

      const doc = await this.initSheet(spreadsheetId);
      const sheet = await this.ensureWorksheet(doc, "Performance Data", [
        "Timestamp",
        "Commit",
        "Branch",
        "Event Type",
        "Overall Score",
        "Performance Score",
        "Accessibility Score",
        "Best Practices Score",
        "SEO Score",
        "First Contentful Paint",
        "Largest Contentful Paint",
        "Cumulative Layout Shift",
        "Time to Interactive",
        "Speed Index",
      ]);

      const row = {
        Timestamp: data.timestamp || new Date().toISOString(),
        Commit: data.commit,
        Branch: data.branch,
        "Event Type": data.eventType,
        "Overall Score": data.overallScore,
        "Performance Score": data.performanceScore,
        "Accessibility Score": data.accessibilityScore,
        "Best Practices Score": data.bestPracticesScore,
        "SEO Score": data.seoScore,
        "First Contentful Paint": data.firstContentfulPaint,
        "Largest Contentful Paint": data.largestContentfulPaint,
        "Cumulative Layout Shift": data.cumulativeLayoutShift,
        "Time to Interactive": data.timeToInteractive,
        "Speed Index": data.speedIndex,
      };

      await sheet.addRow(row);
      console.log("✅ Performance data added to Google Sheets");

      // Get recent performance trend
      const rows = await sheet.getRows({
        limit: 10,
        offset: Math.max(0, sheet.rowCount - 10),
      });
      const recentScores = rows
        .map((r) => parseFloat(r.get("Overall Score")))
        .filter((s) => !isNaN(s));

      if (recentScores.length >= 2) {
        const current = recentScores[recentScores.length - 1];
        const previous = recentScores[recentScores.length - 2];
        const trend = current - previous;

        console.log(
          `📊 Performance trend: ${trend > 0 ? "+" : ""}${(trend * 100).toFixed(1)}%`,
        );

        return {
          current,
          previous,
          trend,
          isRegression: trend < -0.05, // 5% regression threshold
        };
      }

      return { current: data.overallScore, isRegression: false };
    } catch (error) {
      console.error(
        "❌ Failed to add performance data to sheets:",
        error.message,
      );
      // Don't fail the entire workflow for reporting issues
    }
  }

  async addCodeQualityData(data) {
    try {
      const spreadsheetId = process.env.CODE_QUALITY_SPREADSHEET_ID;
      if (!spreadsheetId) {
        console.log("⚠️ CODE_QUALITY_SPREADSHEET_ID not configured");
        return;
      }

      const doc = await this.initSheet(spreadsheetId);
      const sheet = await this.ensureWorksheet(doc, "Code Quality Data", [
        "Timestamp",
        "Commit",
        "Branch",
        "Event Type",
        "Quality Score",
        "Total Errors",
        "Total Warnings",
        "Total Files",
        "Files with Issues",
        "Error Rate",
        "Warning Rate",
        "Top Rule Violations",
      ]);

      const errorRate =
        data.totalFiles > 0
          ? ((data.totalErrors / data.totalFiles) * 100).toFixed(2)
          : 0;
      const warningRate =
        data.totalFiles > 0
          ? ((data.totalWarnings / data.totalFiles) * 100).toFixed(2)
          : 0;

      const row = {
        Timestamp: data.timestamp || new Date().toISOString(),
        Commit: data.commit,
        Branch: data.branch,
        "Event Type": data.eventType,
        "Quality Score": data.qualityScore,
        "Total Errors": data.totalErrors,
        "Total Warnings": data.totalWarnings,
        "Total Files": data.totalFiles,
        "Files with Issues": data.filesWithIssues,
        "Error Rate": errorRate,
        "Warning Rate": warningRate,
        "Top Rule Violations": JSON.stringify(data.topRules?.slice(0, 3) || []),
      };

      await sheet.addRow(row);
      console.log("✅ Code quality data added to Google Sheets");

      // Get quality trend
      const rows = await sheet.getRows({
        limit: 10,
        offset: Math.max(0, sheet.rowCount - 10),
      });
      const recentScores = rows
        .map((r) => parseFloat(r.get("Quality Score")))
        .filter((s) => !isNaN(s));

      if (recentScores.length >= 2) {
        const current = recentScores[recentScores.length - 1];
        const previous = recentScores[recentScores.length - 2];
        const trend = current - previous;

        console.log(
          `📊 Quality trend: ${trend > 0 ? "+" : ""}${trend.toFixed(1)} points`,
        );

        return {
          current,
          previous,
          trend,
          isRegression: trend < -5, // 5 point regression threshold
        };
      }

      return { current: data.qualityScore, isRegression: false };
    } catch (error) {
      console.error(
        "❌ Failed to add code quality data to sheets:",
        error.message,
      );
    }
  }

  async generateTrendReport() {
    try {
      const performanceSheet = await this.getRecentData(
        process.env.LIGHTHOUSE_SPREADSHEET_ID,
        "Performance Data",
        30,
      );

      const qualitySheet = await this.getRecentData(
        process.env.CODE_QUALITY_SPREADSHEET_ID,
        "Code Quality Data",
        30,
      );

      const report = {
        performance: this.analyzeTrend(performanceSheet, "Overall Score"),
        quality: this.analyzeTrend(qualitySheet, "Quality Score"),
        generatedAt: new Date().toISOString(),
      };

      return report;
    } catch (error) {
      console.error("❌ Failed to generate trend report:", error.message);
      return null;
    }
  }

  async getRecentData(spreadsheetId, sheetTitle, days) {
    if (!spreadsheetId) return [];

    const doc = await this.initSheet(spreadsheetId);
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const rows = await sheet.getRows();
    return rows.filter((row) => {
      const timestamp = new Date(row.get("Timestamp"));
      return timestamp >= cutoffDate;
    });
  }

  analyzeTrend(data, scoreColumn) {
    if (!data || data.length < 2) {
      return { trend: "insufficient-data", change: 0 };
    }

    const scores = data
      .map((row) => parseFloat(row.get(scoreColumn)))
      .filter((s) => !isNaN(s));
    if (scores.length < 2) {
      return { trend: "insufficient-data", change: 0 };
    }

    const recent = scores.slice(-7); // Last 7 data points
    const older = scores.slice(-14, -7); // Previous 7 data points

    if (older.length === 0) {
      return { trend: "insufficient-data", change: 0 };
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const change = recentAvg - olderAvg;

    let trend = "stable";
    if (change > 0.05 || change > 5) trend = "improving";
    else if (change < -0.05 || change < -5) trend = "declining";

    return {
      trend,
      change: change.toFixed(2),
      recentAverage: recentAvg.toFixed(2),
      previousAverage: olderAvg.toFixed(2),
      dataPoints: scores.length,
    };
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const reporter = new SheetsReporter();

  try {
    switch (command) {
      case "performance":
        const perfData = JSON.parse(process.argv[3]);
        const perfResult = await reporter.addPerformanceData(perfData);
        if (perfResult) {
          console.log("PERF_TREND=" + JSON.stringify(perfResult));
        }
        break;

      case "quality":
        const qualityData = JSON.parse(process.argv[3]);
        const qualityResult = await reporter.addCodeQualityData(qualityData);
        if (qualityResult) {
          console.log("QUALITY_TREND=" + JSON.stringify(qualityResult));
        }
        break;

      case "report":
        const trendReport = await reporter.generateTrendReport();
        if (trendReport) {
          console.log(JSON.stringify(trendReport, null, 2));
        }
        break;

      default:
        console.log(
          "Usage: node google-sheets-helper.js <performance|quality|report> [data]",
        );
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Sheets helper error:", error.message);
    // Exit with 0 to avoid failing CI for reporting issues
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = SheetsReporter;
