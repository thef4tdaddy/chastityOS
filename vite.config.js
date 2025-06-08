import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { execSync } from 'child_process';

const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
const releaseVersion = `chastityOS-${gitHash}`;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    // The Sentry Vite plugin must be after all other plugins
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
      // and need `project:releases` and `org:read` scopes
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: releaseVersion,
      include: './dist',
      urlPrefix: '~/',
      deploy: {
        env: 'production',
      },
      telemetry: false
    }),
  ],
  // Add the server configuration here
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    // This is important for Sentry to be able to map errors to your source code.
    sourcemap: true,
  }
})
