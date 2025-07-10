import { useCallback, useState, useContext } from 'react';
import { db } from '../firebase';
// Fix: Removed unused 'getDoc' and 'setDoc' imports.
import { doc, writeBatch, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import * as Sentry from '@sentry/react';
import { ActiveUserContext as UserContext } from '../contexts/ActiveUserContext.jsx';

export function useDataManagement({ isAuthReady, userEmail, settings, session, events, tasks }) {
  const { activeUserId: userId } = useContext(UserContext);
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

        // Use 'sexualEventsLog' for all event data
        const eventsCollectionRef = collection(db, 'users', userId, 'sexualEventsLog');
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
  const handleResetAllData = useCallback(async () => {
    if (!isAuthReady || !userId) return;

    console.log("Initiating full data reset...");

    // 1. Delete all tasks
    const tasksCollectionRef = collection(db, "users", userId, "tasks");
    const tasksSnapshot = await getDocs(tasksCollectionRef);
    const batch1 = writeBatch(db);
    tasksSnapshot.forEach(doc => batch1.delete(doc.ref));
    await batch1.commit();
    console.log(`Deleted ${tasksSnapshot.size} tasks.`);

    // 2. Delete all events
    const eventsCollectionRef = collection(db, "users", userId, "sexualEventsLog");
    const eventsSnapshot = await getDocs(eventsCollectionRef);
    const batch2 = writeBatch(db);
    eventsSnapshot.forEach(doc => batch2.delete(doc.ref));
    await batch2.commit();
    console.log(`Deleted ${eventsSnapshot.size} events.`);

    // 3. Delete all account links
    const linksCollectionRef = collection(db, "accountLinks");
    const linkedSnap = await getDocs(query(linksCollectionRef, where("linkedUid", "==", userId)));
    const ownerSnap = await getDocs(query(linksCollectionRef, where("ownerUid", "==", userId)));
    const batch3 = writeBatch(db);
    const seen = new Set();
    linkedSnap.forEach(doc => {
      batch3.delete(doc.ref);
      seen.add(doc.id);
    });
    ownerSnap.forEach(doc => {
      if (!seen.has(doc.id)) batch3.delete(doc.ref);
    });
    await batch3.commit();
    console.log(`Deleted ${linkedSnap.size + ownerSnap.size} account links.`);

    // 4. Finally delete the main user document
    await deleteDoc(doc(db, "users", userId));
    console.log("User document deleted.");

    console.log("✅ All data reset complete. The user document was deleted and will be recreated automatically on next load.");
    alert("✅ All data reset complete. Please reload manually.");
  }, [isAuthReady, userId]);

  return { 
    handleExportData, 
    handleImportData, 
    handleResetAllData, 
    exportMessage, 
    importMessage 
  };
}
