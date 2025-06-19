// src/App.jsx
import React, { useState, Suspense, lazy } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useChastityState } from './hooks/useChastityState';
import MainNav from './components/MainNav';
import FooterNav from './components/FooterNav';
import HotjarScript from './components/HotjarScript';
import Header from './components/Header';
import UpdatePrompt from './components/UpdatePrompt';
import EulaModal from './components/EulaModal';

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsMainPage = lazy(() => import('./pages/SettingsMainPage'));
// FIX: Corrected the import path to match the actual file name.
const SettingsDataManagementPage = lazy(() => import('./pages/SettingsDataManagement.jsx'));
const KeyholderPage = lazy(() => import('./pages/KeyholderPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const RewardsPunishmentsPage = lazy(() => import('./pages/RewardsPunishmentsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));

const App = () => {
    const [currentPage, setCurrentPage] = useState('tracker');
    const [showEulaModal, setShowEulaModal] = useState(false);
    const chastityOS = useChastityState();
    const { isLoading, savedSubmissivesName, isTrackingAllowed, userId, googleEmail } = chastityOS;

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) { console.log('SW Registered:', r); },
        onRegisterError(error) { console.log('SW registration error:', error); },
    });

    const navItemNames = { tracker: "Chastity Tracker", logEvent: "Sexual Event Log", fullReport: "Full Report", keyholder: "Keyholder", tasks: "Tasks", rewards: "Rewards & Punishments", settings: "Settings", privacy: "Privacy & Analytics", feedback: "Submit Beta Feedback" };
    const pageTitleText = navItemNames[currentPage] || "ChastityOS";

    const isNightly = import.meta.env.VITE_APP_VARIANT === 'nightly';
    const themeClass = isNightly ? 'theme-nightly' : 'theme-prod';
    
    if (isLoading) {
      return <div className="loading-fullscreen">Loading...</div>;
    }

    return (
        <div className={`${themeClass} min-h-screen flex flex-col items-center justify-center p-4 md:p-8`}>
            {needRefresh && <UpdatePrompt onUpdate={() => {
                updateServiceWorker(true);
                setNeedRefresh(false);
            }} />}
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
                    {currentPage === 'dataManagement' && <SettingsDataManagementPage {...chastityOS} />}
                    {currentPage === 'privacy' && <PrivacyPage onBack={() => setCurrentPage('settings')} />}
                    {currentPage === 'feedback' && <FeedbackForm onBack={() => setCurrentPage('settings')} userId={userId} />}
                </Suspense>
            </div>
            <FooterNav userId={userId} googleEmail={googleEmail} onShowEula={() => setShowEulaModal(true)} />

            <EulaModal isOpen={showEulaModal} onClose={() => setShowEulaModal(false)} />
        </div>
    );
};

export default App;
