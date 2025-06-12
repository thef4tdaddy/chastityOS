const { execSync } = require("child_process");

const branch = process.env.VERCEL_GIT_COMMIT_REF;
console.log("🛠 Branch:", branch);

if (branch === "nightly") {
  console.log("🔧 Running nightly build");
  execSync("npm run build:nightly", { stdio: "inherit" });
} else {
  console.log("⛔ Production build blocked temporarily. Remove this message in 24 hours to allow production deployment.");
  process.exit(1);
}