const { execSync } = require("child_process");


const branch = process.env.VERCEL_GIT_COMMIT_REF || "";

console.log("🔍 Detected environment variables:");
console.log("    VERCEL_GIT_COMMIT_REF:", process.env.VERCEL_GIT_COMMIT_REF);
console.log("    NODE_ENV:", process.env.NODE_ENV);
console.log("    VERCEL_ENV:", process.env.VERCEL_ENV);

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