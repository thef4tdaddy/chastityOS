const branch = process.env.VERCEL_GIT_COMMIT_REF || "nightly";
console.log("🛠 Branch:", branch);

if (branch === "nightly") {
  console.log("🔧 Running nightly build");
  require("child_process").execSync("npm run build:nightly", { stdio: "inherit" });
} else {
  console.log("⛔ Production build blocked temporarily. Remove this message in 24 hours to allow production deployment.");
  process.exit(1);
}