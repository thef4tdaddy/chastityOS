import { useCallback, useState } from 'react';
import { db } from '../firebase';
// Fix: Removed unused 'getDoc' and 'setDoc' imports.
import { doc, writeBatch, collection, getDocs, query } from 'firebase/firestore';
import * as Sentry from '@sentry/react';

export function useDataManagement({ userId, isAuthReady, userEmail, settings, session, events, tasks }) {
  const [exportMessage, setExportMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');

  const handleExportData = useCallback(() => {
    if (!userId) {
      setExportMessage('User not found.');
      return;
    }
    try {
      const dataToExport = {
        userId,
        userEmail,
        exportedAt: new Date().toISOString(),
        settings,
        session,
        events,
        tasks,
      };
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chastityos-backup-${userId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportMessage('Data exported successfully!');
    } catch (error) {
      console.error("Error exporting data:", error);
      Sentry.captureException(error);
      setExportMessage('Failed to export data.');
    } finally {
      setTimeout(() => setExportMessage(''), 3000);
    }
  }, [userId, userEmail, settings, session, events, tasks]);

  const handleImportData = useCallback(async (file) => {
    if (!file) {
      setImportMessage('No file selected.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.userId) {
          throw new Error('Invalid backup file: Missing user ID.');
        }

        const userDocRef = doc(db, 'users', userId);
        const batch = writeBatch(db);

        // Prepare data for Firestore, converting date strings back to Timestamps
        const settingsToImport = data.settings || {};
        const sessionToImport = data.session ? {
            ...data.session,
            // Add date conversions if your session object has them
        } : {};
        
        // Overwrite the main user document
        batch.set(userDocRef, { settings: settingsToImport, ...sessionToImport });
        
        // Clear old tasks and events before importing new ones
        const tasksCollectionRef = collection(db, 'users', userId, 'tasks');
        const oldTasksSnap = await getDocs(query(tasksCollectionRef));
        oldTasksSnap.forEach(doc => batch.delete(doc.ref));

        const eventsCollectionRef = collection(db, 'users', userId, 'events');
        const oldEventsSnap = await getDocs(query(eventsCollectionRef));
        oldEventsSnap.forEach(doc => batch.delete(doc.ref));
        
        // Import new tasks
        if (data.tasks && Array.isArray(data.tasks)) {
            data.tasks.forEach(task => {
                const newTaskRef = doc(tasksCollectionRef); // Create new doc with new ID
                batch.set(newTaskRef, task);
            });
        }
        
        // Import new events
        if (data.events && Array.isArray(data.events)) {
            data.events.forEach(event => {
                const newEventRef = doc(eventsCollectionRef);
                batch.set(newEventRef, event);
            });
        }
        
        await batch.commit();
        setImportMessage('Data imported successfully! The page will now reload.');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        console.error("Error importing data:", error);
        Sentry.captureException(error);
        setImportMessage(`Import failed: ${error.message}`);
      } finally {
        setTimeout(() => setImportMessage(''), 3000);
      }
    };
    reader.readAsText(file);
  }, [userId]);
  
  // This is the function for resetting data
  const handleResetAllData = useCallback(async (isAccountDeletion = false) => {
    if (!isAuthReady || !userId) return;

    console.log("Initiating full data reset...");
    const batch = writeBatch(db);
    const userDocRef = doc(db, "users", userId);
    
    // 1. Set the main user document back to its default state
    batch.set(userDocRef, {
        settings: {
          submissivesName: '',
          keyholderName: '',
          keyholderPasswordHash: null,
          isTrackingAllowed: true,
          eventDisplayMode: 'kinky',
          rulesText: '',
        },
        // Reset all session-related fields as well
        requiredKeyholderDurationSeconds: 0,
        // ... any other fields on the root user document
    });

    // 2. Delete all documents in the 'tasks' subcollection
    const tasksCollectionRef = collection(db, 'users', userId, 'tasks');
    try {
        const tasksSnapshot = await getDocs(query(tasksCollectionRef));
        tasksSnapshot.forEach(doc => {
            console.log(`Adding task ${doc.id} to delete batch.`);
            batch.delete(doc.ref);
        });
    } catch (error) {
        console.error("Error querying tasks for deletion:", error);
        Sentry.captureException(error);
    }
    
    // 3. (Optional but recommended) Delete all documents in the 'events' subcollection
    const eventsCollectionRef = collection(db, 'users', userId, 'events');
     try {
        const eventsSnapshot = await getDocs(query(eventsCollectionRef));
        eventsSnapshot.forEach(doc => {
            console.log(`Adding event ${doc.id} to delete batch.`);
            batch.delete(doc.ref);
        });
    } catch (error) {
        console.error("Error querying events for deletion:", error);
        Sentry.captureException(error);
    }

    // 4. Commit all the changes at once
    try {
        await batch.commit();
        console.log("Full data reset successful.");
        if (!isAccountDeletion) {
          alert('All data has been reset.');
          window.location.reload(); // Reload to reflect changes
        }
    } catch (error) {
        console.error("Error committing data reset batch:", error);
        Sentry.captureException(error);
        if (!isAccountDeletion) alert(`Failed to reset data: ${error.message}`);
    }
  }, [isAuthReady, userId]);

  return { 
    handleExportData, 
    handleImportData, 
    handleResetAllData, 
    exportMessage, 
    importMessage 
  };
}
