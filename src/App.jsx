import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useChastityState } from './hooks/useChastityState';
import MainNav from './components/MainNav';
import FooterNav from './components/FooterNav';
// Removed HotjarScript - no longer needed
import Header from './components/Header';
import UpdatePrompt from './components/UpdatePrompt';
import EulaModal from './components/EulaModal';
import RestoreSessionPrompt from './components/RestoreSessionPrompt';
import WelcomeModal from './components/WelcomeModal';
import HowToModal from './components/HowToModal';
import { useWelcome } from './hooks/useWelcome';

const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsMainPage = lazy(() => import('./pages/SettingsMainPage'));
const SettingsDataManagementPage = lazy(() => import('./pages/SettingsDataManagement.jsx'));
const KeyholderPage = lazy(() => import('./pages/KeyholderPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const RewardsPunishmentsPage = lazy(() => import('./pages/RewardsPunishmentsPage'));
const RulesPage = lazy(() => import('./pages/RulesPage'));
const KeyholderRulesPage = lazy(() => import('./pages/KeyholderRulesPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));

const App = () => {
  const [currentPage, setCurrentPage] = useState('tracker');
  const [showEulaModal, setShowEulaModal] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(false);

  const chastityOS = useChastityState();

  const {
    isLoading,
    savedSubmissivesName,
    keyholderName,
    userId,
    googleEmail,
    showRestoreSessionPrompt,
    loadedSessionData,
    handleRestoreSession,
    handleDiscardSession
  } = chastityOS;

  const welcomeState = useWelcome(userId, chastityOS.isAuthReady);
  const { hasAccepted, isLoading: welcomeLoading, accept } = welcomeState;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) { console.log('SW Registered:', r); },
    onRegisterError(error) { console.log('SW registration error:', error); },
  });

  // Google Analytics init
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-WJHSVRZZ9S';
    if (window.gtag && measurementId) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          window.gtag('config', measurementId);
          console.log('[GA Debug] Initialized Google Analytics');
        });
      } else {
        window.gtag('config', measurementId);
        console.log('[GA Debug] Initialized Google Analytics (no idleCallback)');
      }
    }
  }, []);

  // Service Worker updates
  useEffect(() => {
    if (needRefresh) {
      console.log("New content available, updating service worker...");
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  const navItemNames = {
    tracker: "Chastity Tracker",
    logEvent: "Sexual Event Log",
    fullReport: "Full Report",
    keyholder: "Keyholder",
    rules: "Rules",
    keyholderRules: "Keyholder Rules",
    tasks: "Tasks",
    rewards: "Rewards & Punishments",
    settings: "Settings",
    privacy: "Privacy & Analytics",
    feedback: "Submit Beta Feedback"
  };

  let pageTitleText = "ChastityOS";
  if (currentPage === 'tracker' && showRestoreSessionPrompt) {
    pageTitleText = "Restore Session";
  } else if (navItemNames[currentPage]) {
    pageTitleText = navItemNames[currentPage];
  }

  const isNightly = import.meta.env.VITE_APP_VARIANT === 'nightly';
  const themeClass = isNightly ? 'theme-nightly' : 'theme-prod';

  if (isLoading || welcomeLoading) {
    return <div className="loading-fullscreen">Loading...</div>;
  }

  return (
    <div className={`${themeClass} min-h-screen flex flex-col items-center justify-center p-4 md:p-8`}>
      {needRefresh && (
        <UpdatePrompt onUpdate={() => {
          updateServiceWorker(true);
          setNeedRefresh(false);
        }} />
      )}
      <Header />
      <div className="w-full max-w-3xl text-center p-6 rounded-xl shadow-lg card">
        {savedSubmissivesName && (
          <p className="app-subtitle">
            Tracking <span className="font-semibold">{savedSubmissivesName}'s</span> Journey
          </p>
        )}
        {keyholderName && (
          <p className="text-sm text-red-300 -mt-2 mb-3">
            under <span className="font-semibold">{keyholderName}'s</span> control
          </p>
        )}
        <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <h2 className="subpage-title no-border">{pageTitleText}</h2>
        <Suspense fallback={<div className="text-center p-8 fallback-text bordered">Loading...</div>}>
          {currentPage === 'tracker' && <TrackerPage {...chastityOS} />}
          {currentPage === 'fullReport' && <FullReportPage {...chastityOS} />}
          {currentPage === 'logEvent' && <LogEventPage {...chastityOS} />}
          {currentPage === 'rules' && <RulesPage {...chastityOS} />}
          {currentPage === 'keyholderRules' && <KeyholderRulesPage {...chastityOS} onBack={() => setCurrentPage('keyholder')} />}
          {currentPage === 'keyholder' && <KeyholderPage {...chastityOS} setCurrentPage={setCurrentPage} />}
          {currentPage === 'tasks' && <TasksPage {...chastityOS} />}
          {currentPage === 'rewards' && <RewardsPunishmentsPage {...chastityOS} />}
          {currentPage === 'settings' && <SettingsMainPage {...chastityOS} setCurrentPage={setCurrentPage} />}
          {currentPage === 'dataManagement' && <SettingsDataManagementPage {...chastityOS} />}
          {currentPage === 'privacy' && <PrivacyPage onBack={() => setCurrentPage('settings')} />}
          {currentPage === 'feedback' && <FeedbackForm onBack={() => setCurrentPage('settings')} userId={userId} />}
        </Suspense>
        {showRestoreSessionPrompt && (
          <RestoreSessionPrompt
            cageOnTime={loadedSessionData?.cageOnTime}
            onRestore={handleRestoreSession}
            onDiscard={handleDiscardSession}
          />
        )}
      </div>
      <FooterNav
        userId={userId}
        googleEmail={googleEmail}
        onShowEula={() => setShowEulaModal(true)}
        onShowHowTo={() => setShowHowToModal(true)}
      />
      <EulaModal isOpen={showEulaModal} onClose={() => setShowEulaModal(false)} />
      <WelcomeModal
        isOpen={!hasAccepted && !showRestoreSessionPrompt}
        onAccept={accept}
        onShowLegal={() => setShowEulaModal(true)}
        onShowHowTo={() => setShowHowToModal(true)}
      />
      <HowToModal isOpen={showHowToModal} onClose={() => setShowHowToModal(false)} />
    </div>
  );
};

export default App;