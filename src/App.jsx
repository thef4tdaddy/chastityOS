import React, { useState, useEffect, Suspense, lazy } from 'react';
import PrivacyPage from './pages/PrivacyPage';
import FooterNav from './components/FooterNav';
import MainNav from './components/MainNav';
import HotjarScript from './components/HotjarScript'; // Uncommented HotjarScript import

// Lazy load page components
const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));

/**
 * Main application component.
 * Handles page routing and Google Analytics integration.
 * @param {object} props - The component's props.
 * @param {boolean} props.isAuthReady - Flag indicating if Firebase authentication is ready.
 * @param {string|null} props.userId - The current authenticated user's ID, or null if not authenticated.
 * @param {string} props.GA_MEASUREMENT_ID - The Google Analytics Measurement ID.
 * @returns {JSX.Element} The rendered App component.
 */
const App = ({ isAuthReady, userId, GA_MEASUREMENT_ID }) => {
  const [currentPage, setCurrentPage] = useState('tracker'); // Default page

  // Effect for Google Analytics page views and configuration
  useEffect(() => {
    // Check if GA is configured, gtag function exists, and auth is ready
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function' && isAuthReady) {
      const pagePath = `/${currentPage}`;
      // Create a more readable page title from the currentPage state
      const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1').trim();

      // Configure Google Analytics with the Measurement ID and user_id
      // This is crucial for GA4 to start tracking and associating data with the user.
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: userId, // Associate the user ID with GA sessions
        // You can add other config parameters here if needed, e.g., send_page_view: false if you manually send it below
      });

      // Send a page_view event to Google Analytics
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_path: pagePath,
        user_id: userId, // Including user_id here is good practice, though config should also set it
      });

      // Push to dataLayer for Google Tag Manager or other dataLayer consumers if needed.
      // If gtag events are sufficient, this might be redundant.
      // Using a distinct event name like 'page_view_datalayer' can help differentiate if using both.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'custom_page_view', // Or 'page_view_datalayer'
        page_title: pageTitle,
        page_path: pagePath,
        user_id: userId,
      });

      // For debugging purposes, you can log what's being sent
      console.log(`GA Event: page_view - Title: ${pageTitle}, Path: ${pagePath}, UserID: ${userId}`);
      console.log(`GA Configured with ID: ${GA_MEASUREMENT_ID}`);

    }
  }, [currentPage, isAuthReady, userId, GA_MEASUREMENT_ID]); // Dependencies for the effect

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-between p-4 md:p-8">
      <HotjarScript isTrackingAllowed={true} /> {/* Uncommented Hotjar script usage */}
      <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
        {/* Main navigation component */}
        <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
        {/* Suspense for lazy-loaded page components */}
        <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
          {/* Conditional rendering based on the currentPage state */}
          {currentPage === 'tracker' && <TrackerPage />}
          {currentPage === 'fullReport' && <FullReportPage />}
          {currentPage === 'logEvent' && <LogEventPage />}
          {/* Pass setCurrentPage to SettingsPage if it needs to navigate to Privacy or Feedback directly */}
          {currentPage === 'settings' && <SettingsPage onViewPrivacyPage={() => setCurrentPage('privacy')} />}
          {currentPage === 'privacy' && <PrivacyPage onBack={() => setCurrentPage('settings')} />}
          {currentPage === 'feedback' && <FeedbackForm onBack={() => setCurrentPage('settings')} />}
        </Suspense>
      </div>
      {/* Footer navigation component */}
      <FooterNav />
    </div>
  );
};

export default App;
