import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import FooterNav from './components/FooterNav';
import TrackerPage from './pages/TrackerPage';
import SettingsDataManagement from './pages/SettingsDataManagement';
import LogEventPage from './pages/LogEventPage';
import FullReportPage from './pages/FullReportPage';
import PrivacyPage from './pages/PrivacyPage';
import UpdatePrompt from './components/UpdatePrompt';
// Corrected Path: Trying a common path alias for the src directory.
import { ChastityOSProvider } from '@/context/ChastityOSProvider';
import useAuth from './hooks/useAuth';
import { useRegisterSW } from 'virtual:pwa-register/react';
import HotjarScript from './components/HotjarScript';
import FeedbackForm from './pages/FeedbackForm';

// Lazy load pages for better performance
const KeyholderPage = lazy(() => import('./pages/KeyholderPage'));
const RewardsPunishmentsPage = lazy(() => import('./pages/RewardsPunishmentsPage'));

function App() {
  const { currentUser, isAuthReady } = useAuth();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered: () => console.log('Service Worker registered.'),
    onRegisterError: (error) => console.error('Service Worker registration error:', error),
  });

  const closePrompt = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  useEffect(() => {
    if (needRefresh) {
      console.log('New content available, updating service worker...');
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  if (!isAuthReady) {
    return <div className="text-center p-8">Loading Authentication...</div>;
  }

  return (
    <ChastityOSProvider currentUser={currentUser}>
      <Router>
        <HotjarScript />
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-50">
          {(needRefresh || offlineReady) && (
            <UpdatePrompt
              offlineReady={offlineReady}
              needRefresh={needRefresh}
              updateServiceWorker={() => updateServiceWorker(true)}
              onClose={closePrompt}
            />
          )}
          <Header />
          <main className="flex-grow container mx-auto p-4">
            <Suspense fallback={<div className="text-center p-8">Loading Page...</div>}>
              <Routes>
                <Route path="/" element={<TrackerPage />} />
                <Route path="/log-event" element={<LogEventPage />} />
                <Route path="/full-report" element={<FullReportPage />} />
                <Route path="/keyholder" element={<KeyholderPage />} />
                <Route path="/rewards-punishments" element={<RewardsPunishmentsPage />} />
                <Route path="/settings" element={<SettingsDataManagement />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/feedback" element={<FeedbackForm />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </main>
          <FooterNav />
        </div>
      </Router>
    </ChastityOSProvider>
  );
}

export default App;
