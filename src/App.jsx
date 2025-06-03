import React, { useState, useEffect, Suspense, lazy } from 'react';
import PrivacyPage from './pages/PrivacyPage';
import FooterNav from './components/FooterNav';
import MainNav from './components/MainNav';
// import HotjarScript from './components/HotjarScript'; // Hotjar is currently removed

// Lazy load page components
const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const FullReportPage = lazy(() => import('./pages/FullReportPage'));
const LogEventPage = lazy(() => import('./pages/LogEventPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));

/**
 * Main application component.
 * Handles page routing and Google Analytics integration.
 * Receives all application state and handlers as props from Main (in main.jsx).
 * @param {object} props - The component's props, including all app state and handlers.
 * @returns {JSX.Element} The rendered App component.
 */
const App = (props) => {
  const { 
    // Core props
    isAuthReady, 
    userId, 
    GA_MEASUREMENT_ID,
    
    // Props for TrackerPage
    isCageOn,
    cageOnTime, // JS Date from main.jsx state
    chastityHistory,
    chastityDuration, // This is the live effective duration for the current session (timeInChastity from main.jsx)
    cageDuration,     // This is the live raw duration for the current session
    handleToggleCage,
    currentChastitySession,
    
    // Props for LogEventPage
    sexualEventsLog,
    isLoadingEvents,
    handleLogNewEvent,
    savedSubmissivesName, // Also used by other pages
    eventLogMessage, // Placeholder prop
    // LogEventPage form state and handlers (passed as placeholders from main.jsx, could be managed locally in LogEventPage)
    newEventDate, setNewEventDate, newEventTime, setNewEventTime, selectedEventTypes, 
    handleEventTypeChange, otherEventTypeChecked, handleOtherEventTypeCheckChange,
    otherEventTypeDetail, setOtherEventTypeDetail, newEventNotes, setNewEventNotes, 
    newEventDurationHours, setNewEventDurationHours, newEventDurationMinutes, 
    setNewEventDurationMinutes, newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount, 
    newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount,

    // Props for FullReportPage
    timeInChastity, 
    timeCageOff,    
    totalChastityTime, 
    totalTimeCageOff,  
    overallTotalPauseTime,
    isPaused,
    accumulatedPauseTimeThisSession,
    
    // Props for SettingsPage
    handleSetSubmissivesName,
    // Placeholder props for SettingsPage (to be fully implemented in main.jsx or locally)
    handleExportTrackerCSV, 
    handleExportEventLogCSV, 
    handleResetAllData, 
    confirmReset, 
    nameMessage, 
    handleExportTextReport, 
    showUserIdInSettings, 
    handleToggleUserIdVisibility,
    submissivesNameInput, 
    handleSubmissivesNameInputChange, 
    restoreUserIdInput,
    handleRestoreUserIdInputChange, 
    handleInitiateRestoreFromId,
    showRestoreFromIdPrompt,
    handleConfirmRestoreFromId,
    handleCancelRestoreFromId,
    restoreFromIdMessage
  } = props;

  const [currentPage, setCurrentPage] = useState('tracker'); // Default page

  // Effect for Google Analytics page views and configuration
  useEffect(() => {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function' && isAuthReady) {
      const pagePath = `/${currentPage}`;
      const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1).replace(/([A-Z])/g, ' $1').trim();
      window.gtag('config', GA_MEASUREMENT_ID, { user_id: userId });
      window.gtag('event', 'page_view', { page_title: pageTitle, page_path: pagePath, user_id: userId });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'custom_page_view', page_title: pageTitle, page_path: pagePath, user_id: userId });
      console.log(`GA Event: page_view - Title: ${pageTitle}, Path: ${pagePath}, UserID: ${userId}`);
      console.log(`GA Configured with ID: ${GA_MEASUREMENT_ID}`);
    }
  }, [currentPage, isAuthReady, userId, GA_MEASUREMENT_ID]);

  // Consolidate props for each page component
  const trackerPageProps = {
    isCageOn,
    cageOnTime, // JS Date
    chastityHistory,
    chastityDuration, // Live effective duration
    cageDuration,     // Live raw duration
    handleToggleCage,
    currentChastitySession
  };
  
  const logEventPageProps = {
    isAuthReady,
    sexualEventsLog,
    isLoadingEvents,
    handleLogNewEvent,
    savedSubmissivesName,
    eventLogMessage,
    // Form state and handlers
    newEventDate, setNewEventDate, newEventTime, setNewEventTime, selectedEventTypes, 
    handleEventTypeChange, otherEventTypeChecked, handleOtherEventTypeCheckChange,
    otherEventTypeDetail, setOtherEventTypeDetail, newEventNotes, setNewEventNotes, 
    newEventDurationHours, setNewEventDurationHours, newEventDurationMinutes, 
    setNewEventDurationMinutes, newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount, 
    newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount
  };

  const fullReportPageProps = {
    savedSubmissivesName,
    userId,
    isCageOn,
    cageOnTime, // JS Date
    timeInChastity, 
    timeCageOff,    
    totalChastityTime, 
    totalTimeCageOff,  
    chastityHistory,
    sexualEventsLog,
    isLoadingEvents,
    isPaused,
    accumulatedPauseTimeThisSession,
    overallTotalPauseTime
  };
  
  const settingsPageProps = {
    isAuthReady, 
    eventLogMessage, 
    handleExportTrackerCSV, chastityHistory,
    handleExportEventLogCSV, sexualEventsLog, handleResetAllData, confirmReset, nameMessage,
    handleExportTextReport,
    userId, 
    showUserIdInSettings, 
    handleToggleUserIdVisibility,
    savedSubmissivesName, 
    submissivesNameInput, 
    handleSubmissivesNameInputChange, 
    handleSetSubmissivesName,
    restoreUserIdInput,
    handleRestoreUserIdInputChange, 
    handleInitiateRestoreFromId,
    showRestoreFromIdPrompt,
    handleConfirmRestoreFromId,
    handleCancelRestoreFromId,
    restoreFromIdMessage
  };


  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-between p-4 md:p-8">
      {/* <HotjarScript isTrackingAllowed={true} /> */}
      <div className="w-full max-w-3xl text-center bg-gray-800 p-6 rounded-xl shadow-lg border border-purple-800">
        <MainNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <Suspense fallback={<div className="text-center p-8 text-purple-300">Loading page...</div>}>
          {currentPage === 'tracker' && <TrackerPage {...trackerPageProps} />}
          {currentPage === 'fullReport' && <FullReportPage {...fullReportPageProps} />}
          {currentPage === 'logEvent' && <LogEventPage {...logEventPageProps} />}
          {currentPage === 'settings' && <SettingsPage {...settingsPageProps} onViewPrivacyPage={() => setCurrentPage('privacy')} />}
          {currentPage === 'privacy' && <PrivacyPage onBack={() => setCurrentPage('settings')} />}
          {currentPage === 'feedback' && <FeedbackForm userId={userId} onBack={() => setCurrentPage('settings')} />}
        </Suspense>
      </div>
      <FooterNav />
    </div>
  );
};

export default App;
