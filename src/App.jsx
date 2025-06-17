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
const SettingsMainPage = lazy(() => import('./pages/SettingsMainPage'));
const SettingsDataManagement = lazy(() => import('./pages/SettingsDataManagement'));
const KeyholderPage = lazy(() => import('./pages/KeyholderPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const RewardsPunishmentsPage = lazy(() => import('./pages/RewardsPunishmentsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage')); // Import TasksPage

const App = () => {
    const [currentPage, setCurrentPage] = useState('tracker');
    const chastityOS = useChastityState();
    const { isLoading, savedSubmissivesName, isTrackingAllowed, userId, googleEmail } = chastityOS;

    const { needRefresh, updateServiceWorker } = useRegisterSW({
        onRegistered: (r) => { if (r) console.log('SW registered.'); },
        onRegisterError: (e) => console.error('SW registration error:', e),
    });

    useEffect(() => {
        if (needRefresh) {
            console.log("New content available, updating...");
            updateServiceWorker(true);
        }
    }, [needRefresh, updateServiceWorker]);

    const navItemNames = { tracker: "Chastity Tracker", logEvent: "Sexual Event Log", fullReport: "Full Report", keyholder: "Keyholder", tasks: "Tasks", rewards: "Rewards & Punishments", settings: "Settings", privacy: "Privacy & Analytics", feedback: "Submit Beta Feedback" };
    const pageTitleText = navItemNames[currentPage] || "ChastityOS";

    const isNightly = import.meta.env.VITE_APP_VARIANT === 'nightly';
    const themeClass = isNightly ? 'theme-nightly' : 'theme-prod';
    if (isLoading) { /* ... (omitted for brevity) ... */ }

    return (
        <div className={`${themeClass} min-h-screen flex flex-col items-center justify-center p-4 md:p-8`}>
            <HotjarScript isTrackingAllowed={isTrackingAllowed} />
            <Header />
            <div className="w-full max-w-3xl text-center p-6 rounded-xl shadow-lg card">
                {savedSubmissivesName && <p className="app-subtitle">Tracking <span className="font-semibold">{savedSubmissivesName}'s</span> Journey</p>}
                <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <h2 className="subpage-title no-border">{pageTitleText}</h2>
                <Suspense fallback={<div className="text-center p-8 fallback-text bordered">Loading...</div>}>
                    {currentPage === 'tracker' && <TrackerPage {...chastityOS} />}
                    {currentPage === 'fullReport' && <FullReportPage {...chastityOS} />}
                    {currentPage === 'logEvent' && <LogEventPage {...chastityOS} />}
                    {currentPage === 'keyholder' && <KeyholderPage {...chastityOS} />}
                    {currentPage === 'tasks' && <TasksPage {...chastityOS} />}
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
