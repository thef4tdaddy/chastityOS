import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import * as Sentry from "@sentry/react";
import { HelmetProvider } from 'react-helmet-async';

// Read all Sentry config from environment variables
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const environment = import.meta.env.VITE_APP_VARIANT || 'production';
const sentryProject = import.meta.env.VITE_SENTRY_PROJECT;

// Only initialize Sentry if a DSN is provided
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      // The feedback integration has been removed as requested.
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, 
    tracePropagationTargets: ["localhost"], // Only trace local requests for development
    // Session Replay
    replaysSessionSampleRate: 0.1, 
    replaysOnErrorSampleRate: 1.0,
    // Set the environment for Sentry
    environment: environment,
  });
  console.log(`[Sentry] Initialized for project '${sentryProject}' in '${environment}' environment.`);
} else {
  console.warn('[Sentry] DSN not found. Sentry is not initialized.');
}

const SentryApp = Sentry.withProfiler(App);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
      <HelmetProvider>
        <SentryApp />
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
