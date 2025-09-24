import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  // Load variables from the correct .env file for the current mode
  // The third argument ('') ensures all variables are loaded, not just VITE_ prefixed ones.
  const env = loadEnv(mode, process.cwd(), '');

  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL('../../package.json', import.meta.url)), 'utf8'));
  const appVersion = packageJson.version;

  let gitHash = 'dev';
  try {
    gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    console.warn('[vite.config.js] Git hash not available. Using "dev" instead.');
  }

  // Use the loaded VITE_APP_VARIANT for the release version
  const releaseVersion = `chastityOS-${env.VITE_APP_VARIANT || 'unknown'}-${gitHash}`;

  // Nightly builds: keep console logs, source maps, less compression
  // Production builds: remove console logs, optimize for performance
  const isNightly = mode === 'nightly';
  const isProduction = mode === 'production';

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
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    plugins: [
      react(),
      tsconfigPaths(),
      tailwindcss(),
      visualizer({
        filename: './dist/bundle-report.html',
        open: !isProduction, // Only open in nightly builds
        gzipSize: true,
        brotliSize: true
      }),
      // Only compress in production builds
      ...(isProduction ? [viteCompression({
        algorithm: 'brotliCompress'
      })] : []),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'ChastityOS',
          short_name: 'ChastityOS',
          start_url: '/',
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#000000',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          screenshots: [
            {
              src: '/screenshots/screenshot-desktop-1.png',
              sizes: '1280x720',
              type: 'image/png'
            },
            {
              src: '/screenshots/screenshot-desktop-1.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide'
            },
            {
              src: '/screenshots/screenshot-mobile-1.png',
              sizes: '540x1027',
              type: 'image/png',
              form_factor: 'narrow'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst'
            },
            {
              urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
              handler: 'StaleWhileRevalidate'
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst'
            }
          ]
        },
        devOptions: {
          enabled: mode !== 'development'
        }
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
      minify: isProduction ? 'terser' : 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      },
      ...(isProduction && {
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      }),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/tests/setup.js',
    },
    esbuild: {
      ...(isNightly && {
        drop: [], // Keep console logs and debugger in nightly builds
      }),
      ...(isProduction && {
        drop: ['console', 'debugger'], // Remove console logs and debugger in production
      }),
    }
  }
})
