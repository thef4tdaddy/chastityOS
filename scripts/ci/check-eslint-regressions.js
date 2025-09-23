const fs = require('fs');

const report = JSON.parse(fs.readFileSync('eslint_report.json', 'utf8'));

const errorCount = report.reduce((acc, file) => acc + file.errorCount, 0);
const warningCount = report.reduce((acc, file) => acc + file.warningCount, 0);

console.log(`ESLint check complete. Found ${errorCount} errors and ${warningCount} warnings.`);

// Define regression thresholds
const MAX_ERRORS = 5;
const MAX_WARNINGS = 50;

if (errorCount > MAX_ERRORS || warningCount > MAX_WARNINGS) {
  console.error(`Regression detected! Errors: ${errorCount} (max ${MAX_ERRORS}), Warnings: ${warningCount} (max ${MAX_WARNINGS}).`);
  // Set an output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `regression_detected=true\n`);
  }
  process.exit(1); // Exit with error to fail the workflow step
} else {
  console.log('No regression detected.');
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `regression_detected=false\n`);
  }
}
