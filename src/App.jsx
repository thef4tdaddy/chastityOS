import React, { useState, useEffect, Suspense, lazy } from 'react';
import PrivacyPage from './pages/PrivacyPage';
import FooterNav from './components/FooterNav';
import MainNav from './components/MainNav';
import HotjarScript from './components/HotjarScript';

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));

const App = ({ isAuthReady, userId, GA_MEASUREMENT_ID }) => {
  const [currentPage, setCurrentPage] = useState('tracker');

  useEffect(() => {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function' && isAuthReady) {
      const pagePath = `/${currentPage}`;
      const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1').trim();

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
  }, [currentPage, isAuthReady, userId, GA_MEASUREMENT_ID]);

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-between p-4 md:p-8">
      <HotjarScript isTrackingAllowed={true} />
      <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
        <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
          {currentPage === 'tracker' && <TrackerPage />}
          {currentPage === 'fullReport' && <FullReportPage />}
          {currentPage === 'logEvent' && <LogEventPage />}
          {currentPage === 'settings' && <SettingsPage onViewPrivacyPage={() => setCurrentPage('privacy')} />}
          {currentPage === 'privacy' && <PrivacyPage onBack={() => setCurrentPage('settings')} />}
          {currentPage === 'feedback' && <FeedbackForm onBack={() => setCurrentPage('settings')} />}
        </Suspense>
      </div>
      <FooterNav />
    </div>
  );
};

export default App;
