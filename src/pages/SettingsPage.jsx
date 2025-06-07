// src/pages/SettingsPage.jsx
import React from 'react';
import AccountSection from '../components/settings/AccountSection';
import KeyholderSection from '../components/settings/KeyholderSection';
import SessionEditSection from '../components/settings/SessionEditSection';
import DataManagementSection from '../components/settings/DataManagementSection';

const SettingsPage = (props) => {
  const {
    isAuthReady,
    userId,
    showUserIdInSettings,
    handleToggleUserIdVisibility,
    savedSubmissivesName,
    submissivesNameInput,
    handleSubmissivesNameInputChange,
    handleSetSubmissivesName,
    nameMessage,

    keyholderName,
    handleSetKeyholder,
    handleClearKeyholder,
    handleUnlockKeyholderControls,
    isKeyholderModeUnlocked,
    handleLockKeyholderControls,
    requiredKeyholderDurationSeconds,
    handleSetRequiredDuration,
    keyholderMessage,

    isCurrentSessionActive,
    cageOnTime,
    editSessionDateInput,
    setEditSessionDateInput,
    editSessionTimeInput,
    setEditSessionTimeInput,
    handleUpdateCurrentCageOnTime,
    editSessionMessage,

    handleExportTextReport,
    handleExportTrackerCSV,
    handleExportEventLogCSV,
    handleExportJSON,
    handleImportJSON,
    handleResetAllData,
    confirmReset,
    eventLogMessage,
    sexualEventsLog,
    chastityHistory,

    restoreUserIdInput,
    handleRestoreUserIdInputChange,
    handleInitiateRestoreFromId,
    restoreFromIdMessage,
    showRestoreFromIdPrompt,
    handleConfirmRestoreFromId,
    handleCancelRestoreFromId
  } = props;
  const googleEmail = props.auth?.user?.email || null;

  return (
    <div className="p-0 md:p-4">
      <AccountSection
        isAuthReady={isAuthReady}
        userId={userId}
        showUserIdInSettings={showUserIdInSettings}
        handleToggleUserIdVisibility={handleToggleUserIdVisibility}
        savedSubmissivesName={savedSubmissivesName}
        submissivesNameInput={submissivesNameInput}
        handleSubmissivesNameInputChange={handleSubmissivesNameInputChange}
        handleSetSubmissivesName={handleSetSubmissivesName}
        nameMessage={nameMessage}
        googleEmail={googleEmail}
        googleEmailNotice={googleEmail ? `Signed in with Google: ${googleEmail}` : null}
      />

      <KeyholderSection
        keyholderName={keyholderName}
        handleSetKeyholder={handleSetKeyholder}
        handleClearKeyholder={handleClearKeyholder}
        handleUnlockKeyholderControls={handleUnlockKeyholderControls}
        isKeyholderModeUnlocked={isKeyholderModeUnlocked}
        handleLockKeyholderControls={handleLockKeyholderControls}
        requiredKeyholderDurationSeconds={requiredKeyholderDurationSeconds}
        handleSetRequiredDuration={handleSetRequiredDuration}
        keyholderMessage={keyholderMessage}
        isAuthReady={isAuthReady}
      />

      <SessionEditSection
        isCurrentSessionActive={isCurrentSessionActive}
        cageOnTime={cageOnTime}
        editSessionDateInput={editSessionDateInput}
        setEditSessionDateInput={setEditSessionDateInput}
        editSessionTimeInput={editSessionTimeInput}
        setEditSessionTimeInput={setEditSessionTimeInput}
        handleUpdateCurrentCageOnTime={handleUpdateCurrentCageOnTime}
        editSessionMessage={editSessionMessage}
        isAuthReady={isAuthReady}
      />

      <DataManagementSection
        isAuthReady={isAuthReady}
        handleExportTextReport={handleExportTextReport}
        handleExportTrackerCSV={handleExportTrackerCSV}
        handleExportEventLogCSV={handleExportEventLogCSV}
        handleExportJSON={handleExportJSON}
        handleImportJSON={handleImportJSON}
        handleResetAllData={handleResetAllData}
        confirmReset={confirmReset}
        nameMessage={nameMessage}
        eventLogMessage={eventLogMessage}
        sexualEventsLog={sexualEventsLog}
        chastityHistory={chastityHistory}
        restoreUserIdInput={restoreUserIdInput}
        handleRestoreUserIdInputChange={handleRestoreUserIdInputChange}
        handleInitiateRestoreFromId={handleInitiateRestoreFromId}
        restoreFromIdMessage={restoreFromIdMessage}
        showRestoreFromIdPrompt={showRestoreFromIdPrompt}
        handleConfirmRestoreFromId={handleConfirmRestoreFromId}
        handleCancelRestoreFromId={handleCancelRestoreFromId}
      />
    </div>
  );
};

export default SettingsPage;
