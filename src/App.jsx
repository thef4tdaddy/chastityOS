// src/App.jsx
import React, { useState, Suspense, lazy } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useChastityState } from './hooks/useChastityState';
import MainNav from './components/MainNav';
import FooterNav from './components/FooterNav';
import HotjarScript from './components/HotjarScript';
import UpdatePrompt from './components/UpdatePrompt.jsx';

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const KeyholderPage = lazy(() => import('./pages/KeyholderPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const RewardsPunishmentsPage = lazy(() => import('./pages/RewardsPunishmentsPage'));

const App = () => {
    const [currentPage, setCurrentPage] = useState('tracker');
    
    // Get all state and logic from the custom hook
    const chastityOS = useChastityState();

    const { 
        isLoading, 
        savedSubmissivesName, 
        showRestoreSessionPrompt, 
        isTrackingAllowed, 
        userId, 
        googleEmail
    } = chastityOS;

    // PWA Update Logic using the hook from vite-plugin-pwa
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('Service Worker registered.', r);
        },
        onRegisterError(error) {
            console.error('Service Worker registration error:', error);
        },
    });

    // This function will be passed to the prompt's button
    const handleUpdate = () => {
        updateServiceWorker(true); // Forces the new service worker to take over and triggers a reload
    };

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

    return (
        <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
            <HotjarScript isTrackingAllowed={isTrackingAllowed} />

            {/* Render the UpdatePrompt when a new version is ready */}
            {needRefresh && <UpdatePrompt onUpdate={handleUpdate} />}

            <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
                <h1 className="text-4xl font-bold text-purple-400 mb-4 tracking-wider">ChastityOS</h1>
                {savedSubmissivesName && <p className="text-lg text-purple-200 mb-6">For: <span className="font-semibold">{savedSubmissivesName}</span></p>}
                
                <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
                
                <h2 className="text-2xl font-bold text-purple-300 mb-4">{pageTitleText}</h2>

                <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
                    {currentPage === 'tracker' && <TrackerPage {...chastityOS} />}
                    {currentPage === 'fullReport' && <FullReportPage {...chastityOS} />}
                    {currentPage === 'logEvent' && <LogEventPage {...chastityOS} />}
                    {currentPage === 'keyholder' && <KeyholderPage {...chastityOS} />}
                    {currentPage === 'rewards' && <RewardsPunishmentsPage {...chastityOS} />}
                    {currentPage === 'settings' && <SettingsPage {...chastityOS} setCurrentPage={setCurrentPage} />}
                    {currentPage === 'privacy' && <PrivacyPage onBack={() => setCurrentPage('settings')} />}
                    {currentPage === 'feedback' && <FeedbackForm onBack={() => setCurrentPage('settings')} userId={userId} />}
                </Suspense>
            </div>
            <FooterNav userId={userId} googleEmail={googleEmail} />
        </div>
    );
};

export default App;
