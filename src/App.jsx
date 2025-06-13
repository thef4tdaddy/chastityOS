// src/App.jsx
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useChastityState } from './hooks/useChastityState';
import MainNav from './components/MainNav';
import FooterNav from './components/FooterNav';
import HotjarScript from './components/HotjarScript';
import Header from './components/Header';

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsMainPage'));
const SettingsMainPage = lazy(() => import('./pages/SettingsMainPage'));
const SettingsDataManagement = lazy(() => import('./pages/SettingsDataManagement'));
const KeyholderPage = lazy(() => import('./pages/KeyholderPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const RewardsPunishmentsPage = lazy(() => import('./pages/RewardsPunishmentsPage'));

const App = () => {
    const [currentPage, setCurrentPage] = useState('tracker');
    const chastityOS = useChastityState();
    const {
        isLoading,
        savedSubmissivesName,
        showRestoreSessionPrompt,
        isTrackingAllowed,
        userId,
        googleEmail
    } = chastityOS;

    // This hook will now automatically handle the update in the background.
    const { needRefresh, updateServiceWorker } = useRegisterSW({
        onRegistered(r) {
          if (r) {
            console.log('Service Worker registered.');
          }
        },
        onRegisterError(error) {
          console.error('Service Worker registration error:', error);
        },
    });

    // This effect will run when a new service worker is available,
    // and it will immediately trigger the update.
    useEffect(() => {
        if (needRefresh) {
            console.log("New content available, updating service worker...");
            updateServiceWorker(true);
        }
    }, [needRefresh, updateServiceWorker]);

    let pageTitleText = "ChastityOS";
    const navItemNames = { tracker: "Chastity Tracker", logEvent: "Sexual Event Log", fullReport: "Full Report", keyholder: "Keyholder", rewards: "Rewards & Punishments", settings: "Settings", privacy: "Privacy & Analytics", feedback: "Submit Beta Feedback" };
    if (currentPage === 'tracker' && showRestoreSessionPrompt) {
        pageTitleText = "Restore Session";
    } else if (navItemNames[currentPage]) {
        pageTitleText = navItemNames[currentPage];
    }

    if (isLoading) {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
                <div className="text-purple-300 text-xl">Loading ChastityOS...</div>
            </div>
        );
    }

    const appEnv = import.meta.env.VITE_APP_ENV || 'production';
    const themeClass = appEnv === 'nightly' ? 'theme-nightly' : 'theme-prod';

    return (
        <div className={`${themeClass} min-h-screen flex flex-col items-center justify-center p-4 md:p-8`}>
            <HotjarScript isTrackingAllowed={isTrackingAllowed} />
            
            {/* The UpdatePrompt component is no longer rendered here. */}

            <Header />

            <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
                {savedSubmissivesName && (
                    <p className="text-md font-semibold text-purple-300 mb-6">
                        ChastityOS is currently tracking {savedSubmissivesName}&apos;s FLR journey
                        {chastityOS.keyholderName && (
                            <span> for {chastityOS.keyholderName}</span>
                        )}
                    </p>
                )}

                <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

                <h2 className="text-2xl font-bold text-purple-300 mb-4">{pageTitleText}</h2>

                <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
                    {currentPage === 'tracker' && <TrackerPage {...chastityOS} />}
                    {currentPage === 'fullReport' && <FullReportPage {...chastityOS} />}
                    {currentPage === 'logEvent' && <LogEventPage {...chastityOS} />}
                    {currentPage === 'keyholder' && <KeyholderPage {...chastityOS} />}
                    {currentPage === 'rewards' && <RewardsPunishmentsPage {...chastityOS} />}
                    {currentPage === 'settings' && <SettingsMainPage {...chastityOS} setCurrentPage={setCurrentPage} />}
                    {currentPage === 'syncData' && <SettingsDataManagement {...chastityOS} setCurrentPage={setCurrentPage} />}
                    {currentPage === 'privacy' && <PrivacyPage onBack={() => setCurrentPage('settings')} />}
                    {currentPage === 'feedback' && <FeedbackForm onBack={() => setCurrentPage('settings')} userId={userId} />}
                </Suspense>
            </div>
            <FooterNav userId={userId} googleEmail={googleEmail} />
        </div>
    );
};

export default App;
