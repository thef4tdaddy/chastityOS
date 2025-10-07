/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  // Additional environment variables
  readonly MODE: string;
  readonly VITE_ENV?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_GITHUB_TOKEN?: string;
  readonly VITE_GITHUB_REPO?: string;
  readonly VITE_DISCORD_WEBHOOK_BUG?: string;
  readonly VITE_DISCORD_WEBHOOK_SUGGESTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
