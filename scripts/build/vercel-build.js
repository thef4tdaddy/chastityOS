#!/usr/bin/env node

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");

/**
 * Smart Vercel build script that chooses the appropriate build mode
 * based on deployment context and branch
 */
function determineMode() {
  // Vercel environment variables
  const vercelEnv = process.env.VERCEL_ENV; // 'production', 'preview', or 'development'
  const vercelGitCommitRef = process.env.VERCEL_GIT_COMMIT_REF; // branch name

  // Local fallback - check current git branch
  let currentBranch = vercelGitCommitRef;
  if (!currentBranch) {
    try {
      currentBranch = execSync("git branch --show-current", {
        encoding: "utf8",
        cwd: projectRoot,
      }).trim();
    } catch (error) {
      console.warn(
        "Could not determine git branch, defaulting to nightly mode",
      );
      currentBranch = "nightly";
    }
  }

  console.log(`🔍 Deployment context:`);
  console.log(`   VERCEL_ENV: ${vercelEnv || "not set"}`);
  console.log(`   Branch: ${currentBranch}`);

  // Determine build mode based on context
  let mode;

  if (vercelEnv === "production" || currentBranch === "main") {
    mode = "production";
  } else if (
    currentBranch === "nightly" ||
    currentBranch?.includes("nightly")
  ) {
    mode = "nightly";
  } else {
    // Default to nightly for PR previews and other branches
    mode = "nightly";
  }

  console.log(`🚀 Building in ${mode} mode`);
  return mode;
}

function runBuild() {
  const mode = determineMode();
  const buildCommand = `vite build --mode ${mode} --config configs/build/vite.config.js`;

  console.log(`📦 Running: ${buildCommand}`);

  try {
    execSync(buildCommand, {
      stdio: "inherit",
      cwd: projectRoot,
    });
    console.log(`✅ Build completed successfully in ${mode} mode`);
  } catch (error) {
    console.error(`❌ Build failed:`, error.message);
    process.exit(1);
  }
}

// Run the build
runBuild();
