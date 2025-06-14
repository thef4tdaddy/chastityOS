import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

// This custom hook centralizes all data management logic (import, export, reset).
export const useDataManagement = ({
  currentUser,
  chastityState,
  setChastityState,
  sexualEventsLog,
  setSexualEventsLog,
  settings,
  setSettings,
  setNameMessage,
  setEventLogMessage,
  confirmReset,
  setConfirmReset,
  setIsRestoring,
  restoreUserIdInput,
  setRestoreUserIdInput,
  setRestoreFromIdMessage,
  setShowRestoreFromIdPrompt,
}) => {

  /**
   * Exports all user data to a single JSON file.
   */
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify({
        chastityState,
        sexualEventsLog,
        settings,
      }, null, 2); // The '2' formats the JSON for readability.
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ChastityOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click(); // Programmatically click the link to trigger the download.
      document.body.removeChild(link); // Clean up by removing the link.
      setEventLogMessage('Data exported successfully.');
      setTimeout(() => setEventLogMessage(''), 3000);
    } catch (error) {
      console.error("Error exporting JSON:", error);
      setEventLogMessage('Failed to export data.');
    }
  };

  /**
   * Imports user data from a JSON backup file, overwriting existing data.
   * @param {Event} event - The file input change event.
   */
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setIsRestoring(true);

        // Update local state to immediately reflect the imported data.
        if (importedData.chastityState) setChastityState(importedData.chastityState);
        if (importedData.sexualEventsLog) setSexualEventsLog(importedData.sexualEventsLog);
        if (importedData.settings) setSettings(importedData.settings);

        // Save the imported data to Firestore in a single batch operation.
        const userRef = doc(db, 'users', currentUser.uid);
        const batch = writeBatch(db);
        batch.set(userRef, {
          chastityState: importedData.chastityState || {},
          sexualEventsLog: importedData.sexualEventsLog || [],
          settings: importedData.settings || {},
        });
        await batch.commit();

        setEventLogMessage('Data restored successfully from backup.');
      } catch (error) {
        console.error('Error importing data:', error);
        setEventLogMessage('Error importing backup. Please check file format.');
      } finally {
        setIsRestoring(false);
        setTimeout(() => setEventLogMessage(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  /**
   * Resets all user data to its default state after a confirmation click.
   */
  const handleResetAllData = async () => {
    // Require a second click for confirmation to prevent accidental deletion.
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000); // Reset confirmation after 5s.
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const batch = writeBatch(db);
      
      // Define the default states for all data slices.
      const defaultState = { isActive: false, sessions: [], chastityHistory: [] };
      const defaultSettings = {
          username: 'Default User', enableSessionManagement: true, enableHistoryTracking: true,
          enableWearerReview: false, enableKeyholderReview: false, personalGoal: 0, displayOption: 'both',
          keyholderName: '', keyholderPasswordHash: null, requiredKeyholderDurationSeconds: null,
          goalDurationSeconds: null, rewards: [], punishments: [], isTrackingAllowed: true, eventDisplayMode: 'kinky',
      };

      // Update local state.
      setChastityState(defaultState);
      setSexualEventsLog([]);
      setSettings(defaultSettings);

      // Overwrite Firestore document with default data.
      batch.set(userRef, {
        chastityState: defaultState,
        sexualEventsLog: [],
        settings: defaultSettings
      });
      await batch.commit();

      setNameMessage('All data has been reset.');
      setConfirmReset(false);
      setTimeout(() => setNameMessage(''), 3000);
    } catch (error) {
      console.error("Error resetting data:", error);
      setNameMessage('Failed to reset data.');
      setTimeout(() => setNameMessage(''), 3000);
    }
  };
  
  /**
   * Generates and downloads a human-readable text report of all sessions and events.
   */
  const handleExportTextReport = () => {
    let report = 'ChastityOS Report\n\n';
    report += `Username: ${settings.username}\n\n`;
    report += '--- Chastity History ---\n';
    chastityState.chastityHistory.forEach(session => {
        report += `Session from ${new Date(session.start).toLocaleString()} to ${session.end ? new Date(session.end).toLocaleString() : 'Now'}\n`;
        report += `Duration: ${session.duration}\n\n`;
    });
    report += '\n--- Event Log ---\n';
    sexualEventsLog.forEach(event => {
        report += `${new Date(event.timestamp).toLocaleString()}: ${event.type} - ${event.notes}\n`;
    });

    const dataBlob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChastityOS_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Exports chastity session history to a CSV file.
   */
  const handleExportTrackerCSV = () => {
    if (!chastityState || !chastityState.chastityHistory) return;
    const headers = ['Start Time', 'End Time', 'Duration (HH:mm:ss)'];
    const rows = chastityState.chastityHistory.map(session => [
      new Date(session.start).toISOString(),
      session.end ? new Date(session.end).toISOString() : 'N/A',
      session.duration,
    ]);
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ChastityOS_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Exports the sexual event log to a CSV file.
   */
  const handleExportEventLogCSV = () => {
    if (!sexualEventsLog) return;
    const headers = ['Timestamp', 'Event Type', 'Notes'];
    const rows = sexualEventsLog.map(event => [
      new Date(event.timestamp).toISOString(),
      event.type,
      `"${event.notes.replace(/"/g, '""')}"` // Handle quotes within notes.
    ]);
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ChastityOS_EventLog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Checks if another User ID exists in Firestore before showing the confirmation prompt.
   */
  const handleInitiateRestoreFromId = async () => {
    if (!restoreUserIdInput.trim()) {
      setRestoreFromIdMessage('Please enter a User ID.');
      return;
    }
    try {
      const userToRestoreRef = doc(db, 'users', restoreUserIdInput.trim());
      const userToRestoreDoc = await getDoc(userToRestoreRef);
      if (userToRestoreDoc.exists()) {
        setRestoreFromIdMessage('User found. Click confirm to overwrite your data.');
        setShowRestoreFromIdPrompt(true); // Show modal
      } else {
        setRestoreFromIdMessage('User ID not found in the database.');
      }
    } catch (error) {
      console.error('Error initiating restore:', error);
      setRestoreFromIdMessage('An error occurred while checking the User ID.');
    }
  };
  
  /**
   * Confirms the restore, fetching another user's data and overwriting the current user's data.
   */
  const handleConfirmRestoreFromId = async () => {
    if (!restoreUserIdInput.trim()) return;
    setIsRestoring(true);
    setShowRestoreFromIdPrompt(false);
    try {
      const userToRestoreRef = doc(db, 'users', restoreUserIdInput.trim());
      const userToRestoreDoc = await getDoc(userToRestoreRef);

      if (userToRestoreDoc.exists()) {
        const dataToRestore = userToRestoreDoc.data();
        
        // Overwrite the current user's data with the fetched data.
        const ownUserRef = doc(db, 'users', currentUser.uid);
        const batch = writeBatch(db);
        batch.set(ownUserRef, dataToRestore);
        await batch.commit();

        // Update local state to trigger re-render.
        if (dataToRestore.chastityState) setChastityState(dataToRestore.chastityState);
        if (dataToRestore.sexualEventsLog) setSexualEventsLog(dataToRestore.sexualEventsLog);
        if (dataToRestore.settings) setSettings(dataToRestore.settings);

        setRestoreFromIdMessage('Data successfully restored.');
      } else {
        setRestoreFromIdMessage('User ID not found. Restore failed.');
      }
    } catch (error) {
      console.error('Error during restore:', error);
      setRestoreFromIdMessage('An error occurred during the restore process.');
    } finally {
      setIsRestoring(false);
      setRestoreUserIdInput('');
      setTimeout(() => setRestoreFromIdMessage(''), 5000);
    }
  };
  
  /**
   * Cancels the restore from ID operation.
   */
  const handleCancelRestoreFromId = () => {
    setShowRestoreFromIdPrompt(false);
    setRestoreFromIdMessage('Restore cancelled.');
    setTimeout(() => setRestoreFromIdMessage(''), 3000);
  };

  /**
   * Updates the input field for the restore User ID.
   * @param {Event} event - The input change event.
   */
  const handleRestoreUserIdInputChange = (event) => {
    setRestoreUserIdInput(event.target.value);
    setRestoreFromIdMessage(''); // Clear message on new input.
  };

  // Return all handler functions to be used by the application.
  return {
    handleExportJSON,
    handleImportJSON,
    handleResetAllData,
    handleExportTextReport,
    handleExportTrackerCSV,
    handleExportEventLogCSV,
    handleInitiateRestoreFromId,
    handleConfirmRestoreFromId,
    handleCancelRestoreFromId,
    handleRestoreUserIdInputChange,
  };
};
