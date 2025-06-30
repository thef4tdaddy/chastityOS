import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load variables from the correct .env file for the current mode
  // The third argument ('') ensures all variables are loaded, not just VITE_ prefixed ones.
  const env = loadEnv(mode, process.cwd(), '');

  let gitHash = 'dev';
  try {
    gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    console.warn('[vite.config.js] Git hash not available. Using "dev" instead.');
  }

  // Use the loaded VITE_APP_VARIANT for the release version
  const releaseVersion = `chastityOS-${env.VITE_APP_VARIANT || 'unknown'}-${gitHash}`;

  return {
    // --- THIS IS THE KEY FIX ---
    // The 'define' option will find and replace these keys with their values
    // in your client-side code at build time.
    define: {
      'import.meta.env.VITE_APP_VARIANT': JSON.stringify(env.VITE_APP_VARIANT),
      'import.meta.env.VITE_SENTRY_PROJECT': JSON.stringify(env.VITE_SENTRY_PROJECT),
      // We don't need to define VITE_SENTRY_DSN here again if main.jsx is already reading it,
      // but being explicit helps prevent issues.
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(env.VITE_SENTRY_DSN),
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // ... your PWA config ...
      }),
      // The Sentry plugin runs in Node.js, so it can use 'env' directly.
      // Your client-side code cannot, which is why the 'define' block is needed.
      sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        release: releaseVersion,
        include: './dist',
        urlPrefix: '~/',
        deploy: {
          env: env.VITE_APP_VARIANT, // Use the loaded env variable
        },
        telemetry: false
      }),
    ],
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
    build: {
      sourcemap: true,
    }
  }
})
