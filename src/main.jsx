// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from "@sentry/react";
import './index.css';
import App from './App.jsx';

console.log('[SENTRY CONFIG]', {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE,
  env: import.meta.env.VITE_ENV,
});

// Initialize Sentry for error and performance monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: import.meta.env.VITE_SENTRY_RELEASE || 'chastityOS-dev',
  environment: import.meta.env.VITE_ENV || 'unknown',
  integrations: [
    // See docs for support of different integrations
    // https://docs.sentry.io/platforms/javascript/guides/react/features/
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  
  // Performance Monitoring
  // Capture 100% of the transactions.
  // Adjust this value in production to a lower number to avoid overwhelming your Sentry quota.
  tracesSampleRate: 1.0, 
  
  // Session Replay
  // This sets the sample rate at 10%. You may want to change it to 100% while in development
  // and then sample at a lower rate in production.
  replaysSessionSampleRate: 0.1, 
  
  // If you're not already sampling the entire session, change the sample rate to 100% 
  // when sampling sessions where errors occur.
  replaysOnErrorSampleRate: 1.0, 
});

Sentry.setTag("environment", import.meta.env.VITE_ENV);
Sentry.setTag("project", import.meta.env.VITE_SENTRY_PROJECT);

if (import.meta.env.DEV) {
  console.info(`[Sentry] Environment: ${import.meta.env.VITE_ENV}`);
  console.info(`[Sentry] Project: ${import.meta.env.VITE_SENTRY_PROJECT}`);
}

if (import.meta.env.VITE_ENV === 'prod') {
  console.debug = () => {};
  console.log = () => {};
  console.info = () => {};
  // Keep errors, and optionally warnings:
  // console.warn = () => {};
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error has occurred. Please refresh the page.</p>}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
