// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from "@sentry/react";
import './index.css';
import App from './App.jsx';

// Initialize Sentry for error and performance monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
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
