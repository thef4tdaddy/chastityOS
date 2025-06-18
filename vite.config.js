import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    optimizeDeps: {
      include: ['bcryptjs'],
    },
    // FIX: Adding the 'ssr.noExternal' option to force Vite to bundle 'bcryptjs'.
    ssr: {
      noExternal: ['bcryptjs'],
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            react: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
            sentry: ['@sentry/react', '@sentry/browser', '@sentry/tracing'],
            ui: ['@headlessui/react', '@heroicons/react'],
          },
        },
      },
    },
    plugins: [
      react(),
      visualizer({
        filename: 'reports/bundle-visualizer.html',
        open: false,
      }),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'ChastityOS',
          short_name: 'ChastityOS',
          description: 'A chastity tracking app for wearers and keyholders.',
          theme_color: '#ffffff',
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
          ],
        },
      }),
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: 'chastityos',
        project: 'chastityos',
      }),
    ],
  };
});
