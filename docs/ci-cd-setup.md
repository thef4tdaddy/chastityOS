# CI/CD Setup Guide for ChastityOS

This guide covers setting up the comprehensive CI/CD pipeline for ChastityOS, including advanced reporting, security scanning, performance monitoring, and automated deployments.

## Overview

ChastityOS uses a modern CI/CD pipeline with:
- **Security & Quality Scanning**: Automated vulnerability detection and code quality monitoring
- **Performance Monitoring**: Lighthouse audits, bundle analysis, and Web Vitals tracking
- **Advanced Reporting**: Google Sheets integration and Discord notifications
- **Automated Deployments**: Nightly and production deployments to Vercel
- **Dependency Management**: Automated updates via Dependabot

## Required Environment Variables

### Core CI/CD Variables
These are automatically provided by GitHub Actions:
- `GITHUB_TOKEN` - Automatically provided by GitHub
- `GITHUB_REPOSITORY` - Automatically provided by GitHub
- `GITHUB_SHA` - Automatically provided by GitHub

### Vercel Deployment (Required)
Add these secrets to your GitHub repository:

```bash
VERCEL_TOKEN=           # Vercel access token
VERCEL_ORG_ID=          # Vercel organization ID
VERCEL_PROJECT_ID=      # Vercel project ID
```

**Setup Instructions:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Settings → Tokens → Create Token
3. Copy the token to `VERCEL_TOKEN`
4. Find your Organization ID in Settings → General
5. Find your Project ID in Project Settings → General

### Google Sheets Integration (Optional)
For performance and code quality data tracking:

```bash
GSHEET_CLIENT_EMAIL=           # Service account email
GSHEET_PRIVATE_KEY=           # Service account private key
LIGHTHOUSE_SPREADSHEET_ID=    # Performance data spreadsheet
CODE_QUALITY_SPREADSHEET_ID= # Code quality data spreadsheet
```

**Setup Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create a Service Account:
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Download the JSON key file
5. Extract credentials:
   - `GSHEET_CLIENT_EMAIL`: The "client_email" field
   - `GSHEET_PRIVATE_KEY`: The "private_key" field (keep \\n literally)
6. Create Google Sheets:
   - Create two new Google Sheets
   - Share them with the service account email
   - Copy the spreadsheet IDs from URLs

### Discord Notifications (Optional)
For real-time CI/CD notifications:

```bash
DISCORD_WEBHOOK_URL=    # Discord webhook URL
```

**Setup Instructions:**
1. Go to your Discord server
2. Navigate to Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Configure name and channel
5. Copy webhook URL

### Lighthouse GitHub Integration (Optional)
For enhanced Lighthouse CI features:

```bash
LHCI_GITHUB_APP_TOKEN=  # Lighthouse CI GitHub app token
```

**Setup Instructions:**
1. Install [Lighthouse CI GitHub App](https://github.com/apps/lighthouse-ci)
2. Configure for your repository
3. Generate and copy the app token

## Repository Secrets Setup

Add all secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value

### Required vs Optional Secrets

**Required (CI/CD will fail without these):**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Optional (CI/CD will continue with warnings):**
- `GSHEET_CLIENT_EMAIL`
- `GSHEET_PRIVATE_KEY`
- `LIGHTHOUSE_SPREADSHEET_ID`
- `CODE_QUALITY_SPREADSHEET_ID`
- `DISCORD_WEBHOOK_URL`
- `LHCI_GITHUB_APP_TOKEN`

## Workflow Configuration

### Automatic Triggers

The CI/CD pipeline runs automatically on:

- **Push to main/nightly**: Full deployment pipeline
- **Pull Requests**: Testing and quality checks
- **Scheduled runs**: Weekly security scans and quality reports
- **Manual triggers**: All workflows support manual execution

### Branch Strategy

- **nightly**: Development branch, auto-deploys to staging
- **main**: Production branch, auto-deploys to production
- **feature branches**: Run tests but don't deploy

## Google Sheets Setup

### Performance Data Sheet Structure
Create a sheet named "Performance Data" with these columns:

| Column | Description |
|--------|-------------|
| Timestamp | ISO timestamp of the audit |
| Commit | Git commit hash |
| Branch | Git branch name |
| Event Type | push, pull_request, schedule |
| Overall Score | Lighthouse overall score (0-1) |
| Performance Score | Performance category score |
| Accessibility Score | Accessibility category score |
| Best Practices Score | Best practices score |
| SEO Score | SEO category score |
| First Contentful Paint | FCP in milliseconds |
| Largest Contentful Paint | LCP in milliseconds |
| Cumulative Layout Shift | CLS score |
| Time to Interactive | TTI in milliseconds |
| Speed Index | Speed Index score |

### Code Quality Data Sheet Structure
Create a sheet named "Code Quality Data" with these columns:

| Column | Description |
|--------|-------------|
| Timestamp | ISO timestamp of the analysis |
| Commit | Git commit hash |
| Branch | Git branch name |
| Event Type | push, pull_request, schedule |
| Quality Score | Calculated quality score (0-100) |
| Total Errors | Number of ESLint errors |
| Total Warnings | Number of ESLint warnings |
| Total Files | Total files analyzed |
| Files with Issues | Files containing violations |
| Error Rate | Percentage of files with errors |
| Warning Rate | Percentage of files with warnings |
| Top Rule Violations | JSON array of most violated rules |

## Discord Integration

### Notification Types

1. **Performance Notifications**:
   - ✅ Good performance scores
   - ⚠️ Performance regressions
   - 📊 Daily performance summaries

2. **Code Quality Notifications**:
   - ✅ Quality improvements
   - 🚨 Quality regressions
   - 📈 Weekly quality trends

3. **Deployment Notifications**:
   - 🚀 Successful deployments
   - ❌ Failed deployments
   - 📋 Weekly reports

### Discord Channel Setup

Recommended channel structure:
- `#ci-performance` - Performance notifications
- `#ci-quality` - Code quality notifications
- `#ci-deployments` - Deployment notifications
- `#ci-reports` - Weekly/monthly reports

## Workflow Details

### Security Workflow (.github/workflows/security.yml)
- **Triggers**: Push, PR, weekly schedule
- **Features**: Dependency scanning, CodeQL analysis, environment variable security
- **Outputs**: Security reports, automated issue creation

### Performance Workflow (.github/workflows/performance.yml)
- **Triggers**: Push, PR, daily schedule
- **Features**: Bundle analysis, Lighthouse audits, Web Vitals monitoring
- **Outputs**: Performance data to sheets, regression notifications

### Deployment Workflow (.github/workflows/deploy.yml)
- **Triggers**: Push to main/nightly
- **Features**: Environment-specific builds, health checks
- **Outputs**: Deployed applications, deployment notifications

### Reporting Workflows
- **ESLint Reporting**: Code quality analysis and trending
- **Lighthouse Reporting**: Performance monitoring and regression detection

## Troubleshooting

### Common Issues

1. **Google Sheets Authentication Errors**:
   - Verify service account email has access to sheets
   - Check private key format (should contain \\n literally)
   - Ensure Google Sheets API is enabled

2. **Discord Webhook Failures**:
   - Verify webhook URL is correct and active
   - Check webhook permissions in Discord

3. **Vercel Deployment Failures**:
   - Verify all Vercel tokens are correct
   - Check project exists and is accessible

4. **Lighthouse CI Issues**:
   - Ensure build creates dist/ directory
   - Check port availability (3000, 4173)
   - Verify Lighthouse CI configuration

### Debug Mode

Enable debug mode by adding this to workflow files:
```yaml
env:
  CI_DEBUG: true
```

### Manual Testing

Test reporting scripts locally:
```bash
# Install dependencies
npm install

# Test Google Sheets (requires env vars)
node scripts/ci/google-sheets-helper.js performance '{"overallScore":0.85,"commit":"abc123"}'

# Test Discord notifications (requires webhook URL)
node scripts/ci/discord-reporter.js performance '{"overallScore":0.85,"isRegression":false}'
```

## Monitoring

### Health Checks

Monitor these indicators:
- ✅ All workflows completing successfully
- 📊 Regular data flowing to Google Sheets
- 🔔 Discord notifications being received
- 🚀 Deployments completing successfully

### Performance Baselines

Establish baselines for:
- **Performance Score**: Target ≥ 80%
- **Code Quality Score**: Target ≥ 85/100
- **Error Count**: Target ≤ 5 errors
- **Bundle Size**: Monitor for 10%+ increases

## Support

For issues with this CI/CD setup:
1. Check GitHub Actions logs first
2. Verify all required secrets are configured
3. Test integrations manually using provided scripts
4. Create GitHub issue with specific error details

## Security Considerations

- Never commit secrets to repository
- Use GitHub secrets for all sensitive data
- Regularly rotate API tokens and keys
- Monitor for unauthorized access in integrations
- Review security scan results weekly