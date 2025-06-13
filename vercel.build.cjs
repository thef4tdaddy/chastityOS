const { execSync } = require("child_process");

const branch = process.env.VERCEL_GIT_COMMIT_REF || "";

console.log(`🛠 Branch: ${branch}`);

if (branch === "main") {
  console.log("🚀 Running production build...");
  execSync("npm run build:production", { stdio: "inherit" });
} else if (branch === "nightly") {
  console.log("🔧 Running nightly build...");
  execSync("npm run build:nightly", { stdio: "inherit" });
} else {
  console.log("⚠️ Unknown branch. Skipping custom build.");
  process.exit(0);
}