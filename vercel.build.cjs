const { execSync } = require("child_process");

const env = process.env.VERCEL_ENV || "";

console.log("🔍 Detected environment variables:");
console.log("    VERCEL_GIT_COMMIT_REF:", process.env.VERCEL_GIT_COMMIT_REF);
console.log("    NODE_ENV:", process.env.NODE_ENV);
console.log("    VERCEL_ENV:", process.env.VERCEL_ENV);

console.log(`🛠 Environment: ${env}`);

if (env === "production") {
  console.log("🚀 Running production build...");
  execSync("npm run build:production", { stdio: "inherit" });
} else if (env === "preview") {
  console.log("🔧 Running nightly build...");
  execSync("npm run build:nightly", { stdio: "inherit" });
} else {
  console.log("⚠️ Unknown environment. Skipping custom build.");
  process.exit(0);
}