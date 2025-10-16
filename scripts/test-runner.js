#!/usr/bin/env node

/**
 * Test Runner Script
 * Orchestrates different types of testing based on command line arguments
 */

const { spawn } = require("child_process");
const path = require("path");

const commands = {
  unit: "npx vitest run --config vitest.config.ts",
  "unit:watch": "npx vitest --config vitest.config.ts",
  "unit:coverage": "npx vitest run --coverage --config vitest.config.ts",
  e2e: "npx playwright test",
  "e2e:ui": "npx playwright test --ui",
  "e2e:headed": "npx playwright test --headed",
  "e2e:debug": "npx playwright test --debug",
  all: "npm run test:unit && npm run test:e2e",
  lint: "npm run lint",
  "lint:fix": "npm run lint:fix",
  typecheck: "npm run typecheck",
  ci: "npm run lint && npm run typecheck && npm run test:unit:coverage && npm run test:e2e",
};

function runCommand(cmd, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running: ${cmd} ${args.join(" ")}`);

    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
      cwd: process.cwd(),
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully`);
        resolve();
      } else {
        console.log(`❌ Command failed with exit code ${code}`);
        reject(new Error(`Command failed: ${cmd}`));
      }
    });

    child.on("error", (error) => {
      console.error("❌ Failed to start command:", error);
      reject(error);
    });
  });
}

async function main() {
  const testType = process.argv[2] || "unit";

  console.log("🚀 ChastityOS Test Runner");
  console.log(`📋 Running test type: ${testType}`);

  if (!commands[testType]) {
    console.error(`❌ Unknown test type: ${testType}`);
    console.log("\n📚 Available test types:");
    Object.keys(commands).forEach((cmd) => {
      console.log(`   ${cmd}`);
    });
    process.exit(1);
  }

  try {
    const command = commands[testType];
    const [cmd, ...args] = command.split(" ");
    await runCommand(cmd, args);

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("\n💥 Test run failed:", error.message);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n\n⏹️  Test run interrupted by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n⏹️  Test run terminated");
  process.exit(0);
});

main().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
