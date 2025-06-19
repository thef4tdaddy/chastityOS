// src/hooks/useDataManagement.js
import { useCallback } from 'react';
import { writeBatch, doc, getDocs, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { formatTime, formatElapsedTime } from '../utils';

// A utility function to trigger file downloads
const triggerDownload = (filename, content, contentType = 'text/plain') => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
};

// FIX: Added default empty objects {} to prevent crashes when state is not ready.
export const useDataManagement = ({
    userId,
    settingsState = {},
    sessionState = {},
    eventLogState = {},
    getEventsCollectionRef
}) => {
    const handleExportTextReport = useCallback(() => {
        let report = `ChastityOS Report\n`;
        report += `Generated: ${formatTime(new Date(), true, true)}\n`;
        report += `Submissive: ${settingsState.savedSubmissivesName || 'N/A'}\n`;
        report += `User ID: ${userId}\n\n`;

        report += `--- CURRENT STATUS ---\n`;
        const effectiveCurrentTime = sessionState.isCageOn ? sessionState.timeInChastity - sessionState.accumulatedPauseTimeThisSession : 0;
        report += `Cage Status: ${sessionState.isCageOn ? (sessionState.isPaused ? 'ON (Paused)' : 'ON') : 'OFF'}\n`;
        if (sessionState.isCageOn && sessionState.cageOnTime) {
            report += `Current Session Started: ${formatTime(sessionState.cageOnTime, true, true)}\n`;
        }
        report += `Effective Time This Session: ${formatElapsedTime(effectiveCurrentTime || 0)}\n\n`;

        report += `--- TOTALS ---\n`;
        report += `Total Effective Chastity Time: ${formatElapsedTime(sessionState.totalChastityTime || 0)}\n`;
        report += `Total Time Cage Off: ${formatElapsedTime(sessionState.totalTimeCageOff || 0)}\n`;
        report += `Total Paused Time: ${formatElapsedTime(sessionState.overallTotalPauseTime || 0)}\n\n`;

        report += `--- CHASTITY HISTORY ---\n`;
        // FIX: Use optional chaining (?.) and default array ([]) for safety
        if ((sessionState.chastityHistory?.length || 0) > 0) {
            [...sessionState.chastityHistory].reverse().forEach(h => {
                report += `Period ${h.periodNumber}: ${formatTime(h.startTime, true, true)} to ${formatTime(h.endTime, true, true)}\n`;
                report += `  - Raw Duration: ${formatElapsedTime(h.duration)}\n`;
                report += `  - Paused: ${formatElapsedTime(h.totalPauseDurationSeconds || 0)}\n`;
                report += `  - Effective: ${formatElapsedTime((h.duration || 0) - (h.totalPauseDurationSeconds || 0))}\n`;
                report += `  - Reason: ${h.reasonForRemoval || 'N/A'}\n\n`;
            });
        } else {
            report += 'No history.\n\n';
        }

        report += `--- EVENT LOG ---\n`;
        // FIX: Use optional chaining (?.) and default array ([]) for safety
        if ((eventLogState.sexualEventsLog?.length || 0) > 0) {
            [...eventLogState.sexualEventsLog].forEach(e => {
                const types = [...(e.types || [])];
                if (e.otherTypeDetail) types.push(`Other: ${e.otherTypeDetail}`);
                report += `${formatTime(e.eventTimestamp, true, true)} - ${types.join(', ')}\n`;
                if(e.notes) report += `  Notes: ${e.notes}\n`;
            });
        } else {
            report += 'No events.\n';
        }

        triggerDownload('ChastityOS-Report.txt', report);
    }, [userId, settingsState, sessionState, eventLogState]);

    const handleExportTrackerCSV = useCallback(() => {
        // FIX: Use optional chaining (?.) for safety
        if (!sessionState.chastityHistory?.length) return alert('No tracker history to export.');
        const headers = "Period,Start Time,End Time,Raw Duration (s),Paused Duration (s),Effective Duration (s),Reason for Removal";
        const rows = [...sessionState.chastityHistory].reverse().map(h =>
            [
                h.periodNumber,
                formatTime(h.startTime, true, true),
                formatTime(h.endTime, true, true),
                h.duration || 0,
                h.totalPauseDurationSeconds || 0,
                (h.duration || 0) - (h.totalPauseDurationSeconds || 0),
                `"${(h.reasonForRemoval || '').replace(/"/g, '""')}"`
            ].join(',')
        );
        triggerDownload('ChastityOS-TrackerHistory.csv', [headers, ...rows].join('\n'));
    }, [sessionState.chastityHistory]);

    const handleExportEventLogCSV = useCallback(() => {
        // FIX: Use optional chaining (?.) for safety
        if (!eventLogState.sexualEventsLog?.length) return alert('No event log data to export.');
        const headers = "Timestamp,Types,Other Detail,Duration (s),Self Orgasm Count,Partner Orgasm Count,Notes";
        const rows = [...eventLogState.sexualEventsLog].map(e => {
            const types = (e.types || []).join('; ');
            return [
                formatTime(e.eventTimestamp, true, true),
                `"${types}"`,
                `"${e.otherTypeDetail || ''}"`,
                e.durationSeconds || 0,
                e.selfOrgasmAmount || 0,
                e.partnerOrgasmAmount || 0,
                `"${(e.notes || '').replace(/"/g, '""')}"`
            ].join(',')
        });
        triggerDownload('ChastityOS-EventLog.csv', [headers, ...rows].join('\n'));
    }, [eventLogState.sexualEventsLog]);

    const handleExportJSON = useCallback(() => {
        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            settings: {
                submissivesName: settingsState.savedSubmissivesName,
                keyholderName: settingsState.keyholderName,
                keyholderPasswordHash: settingsState.keyholderPasswordHash,
                requiredKeyholderDurationSeconds: settingsState.requiredKeyholderDurationSeconds,
                goalDurationSeconds: settingsState.goalDurationSeconds,
                rewards: settingsState.rewards,
                punishments: settingsState.punishments,
                eventDisplayMode: settingsState.eventDisplayMode
            },
            session: {
                chastityHistory: sessionState.chastityHistory,
                totalTimeCageOff: sessionState.totalTimeCageOff,
                lastPauseEndTime: sessionState.lastPauseEndTime,
                hasSessionEverBeenActive: sessionState.hasSessionEverBeenActive,
            },
            eventLog: eventLogState.sexualEventsLog
        };
        triggerDownload('ChastityOS-Backup.json', JSON.stringify(backupData, null, 2), 'application/json');
    }, [settingsState, sessionState, eventLogState]);

    const handleImportJSON = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);

                const batch = writeBatch(db);
                const userDocRef = doc(db, 'users', userId);

                const combinedUserData = { ...data.settings, ...data.session };
                batch.set(userDocRef, combinedUserData, { merge: true });

                const eventsColRef = getEventsCollectionRef();
                if(eventsColRef) {
                    const existingEvents = await getDocs(query(eventsColRef));
                    existingEvents.forEach(doc => batch.delete(doc.ref));

                    if (data.eventLog && Array.isArray(data.eventLog)) {
                        data.eventLog.forEach(log => {
                            const newEventRef = doc(eventsColRef);
                            const { id: _id, ...logData } = log;
                            if (logData.eventTimestamp) {
                                logData.eventTimestamp = Timestamp.fromDate(new Date(logData.eventTimestamp));
                            }
                            batch.set(newEventRef, logData);
                        });
                    }
                }

                await batch.commit();

                alert('Data imported successfully! The app will now refresh to apply changes.');
                window.location.reload();

            } catch (error) {
                console.error("Failed to import JSON:", error);
                alert(`Error importing data: ${error.message}`);
            } finally {
                event.target.value = null;
            }
        };
        reader.readAsText(file);

    }, [userId, getEventsCollectionRef]);

    const handleResetAllData = useCallback(async () => {
        if (!userId) {
            throw new Error('You must be logged in to reset data.');
        }
        try {
            const batch = writeBatch(db);
            const eventsColRef = getEventsCollectionRef();
            if (eventsColRef) {
                const eventsSnapshot = await getDocs(query(eventsColRef));
                eventsSnapshot.forEach(doc => batch.delete(doc.ref));
            }
            const defaultUserData = {
                savedSubmissivesName: '', keyholderName: '', keyholderPasswordHash: null,
                requiredKeyholderDurationSeconds: 0, goalDurationSeconds: 0, rewards: [],
                punishments: [], eventDisplayMode: 'table', isTrackingAllowed: true,
                isCageOn: false, cageOnTime: null, timeInChastity: 0,
                accumulatedPauseTimeThisSession: 0, isPaused: false, lastPauseTime: null,
                overallTotalPauseTime: 0, totalChastityTime: 0, chastityHistory: [],
                totalTimeCageOff: 0, lastPauseEndTime: null, hasSessionEverBeenActive: false,
            };
            const userDocRef = doc(db, 'users', userId);
            batch.set(userDocRef, defaultUserData);
            await batch.commit();
            return true;
        } catch (error) {
            console.error("Failed to reset data:", error);
            throw error;
        }
    }, [userId, getEventsCollectionRef]);

    return {
        handleExportTextReport,
        handleExportTrackerCSV,
        handleExportEventLogCSV,
        handleExportJSON,
        handleImportJSON,
        handleResetAllData,
    };
};
