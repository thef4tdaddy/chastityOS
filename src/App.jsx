
import React, { useState, useEffect, Suspense, lazy } from 'react';
import PrivacyPage from './pages/PrivacyPage';
const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));

// Global error listener
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
});

const App = ({
  isAuthReady = false,
  userId = '',
  GA_MEASUREMENT_ID = '',
  isCageOn = false,
  cageOnTime = null,
  chastityHistory = [],
  chastityDuration = 0,
  cageDuration = 0
}) => {
  const [currentPage, setCurrentPage] = useState('tracker');

  useEffect(() => {
    try {
      if (GA_MEASUREMENT_ID && typeof window.gtag === 'function' && isAuthReady) {
        const pagePath = `/${currentPage}`;
        const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1').trim();

        console.log(`GA: Tracking page_view for ${pageTitle} (${pagePath})`);
        window.gtag('event', 'page_view', {
          page_title: pageTitle,
          page_path: pagePath,
          user_id: userId
        });

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'page_view',
          page_title: pageTitle,
          page_path: pagePath,
          user_id: userId
        });
      }
    } catch (error) {
      console.error('Error in analytics tracking:', error);
    }
  }, [currentPage, isAuthReady, userId, GA_MEASUREMENT_ID]);

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
        {currentPage !== 'privacy' && currentPage !== 'feedback' && (
          <nav className="mb-6 flex flex-wrap justify-center space-x-1 sm:space-x-2">
            {[
              { id: 'tracker', name: 'Chastity Tracker' },
              { id: 'logEvent', name: 'Log Event' },
              { id: 'fullReport', name: 'Full Report' },
              { id: 'settings', name: 'Settings' },
              { id: 'privacy', name: 'Privacy' },
              { id: 'feedback', name: 'Feedback' }
            ].map((page) => (
              <button
                type="button"
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  currentPage === page.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-700 text-purple-300 hover:bg-purple-500 hover:text-white'
                }`}
              >
                {page.name}
              </button>
            ))}
            <a
              href="https://ko-fi.com/chastityos"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium bg-pink-600 text-white hover:bg-pink-700 shadow-md"
            >
              Support on Ko-fi
            </a>
          </nav>
        )}
        <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
          {currentPage === 'tracker' && (
            <TrackerPage
              isCageOn={isCageOn}
              cageOnTime={cageOnTime}
              chastityHistory={chastityHistory}
              chastityDuration={chastityDuration}
              cageDuration={cageDuration}
            />
          )}
          {currentPage === 'fullReport' && <FullReportPage />}
          {currentPage === 'logEvent' && <LogEventPage />}
          {currentPage === 'settings' && <SettingsPage onViewPrivacyPage={() => setCurrentPage('privacy')} />}
          {currentPage === 'privacy' && <PrivacyPage onBack={() => setCurrentPage('settings')} />}
          {currentPage === 'feedback' && <FeedbackForm onBack={() => setCurrentPage('settings')} />}
        </Suspense>
      </div>
      <footer className="mt-8 text-center text-xs text-gray-500">
        © 2025 ChastityOS
      </footer>
    </div>
  );
};

export default App;
