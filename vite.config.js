import path from 'path';
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { execSync } from 'child_process';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
  const releaseVersion = `chastityOS-${gitHash}`;

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate', // Changed from 'prompt'
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'ChastityOS',
          short_name: 'ChastityOS',
          description: 'A modern chastity and FLR tracking web app.',
          theme_color: '#4f46e5',
          background_color: '#111827',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          // This will ensure the service worker updates and activates new content seamlessly.
          skipWaiting: true,
          clientsClaim: true,
          // Precaching essential assets for offline use.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
          // Caching strategies for runtime requests.
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firestore-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
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
