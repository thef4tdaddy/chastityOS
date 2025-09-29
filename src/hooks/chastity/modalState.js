import { useState } from 'react';

export function useModalState() {
    // --- Modal and Dialog State ---
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [reasonForRemoval, setReasonForRemoval] = useState('');
    const [tempEndTime, setTempEndTime] = useState(null);
    const [tempStartTime, setTempStartTime] = useState(null);
    const [showRestoreSessionPrompt, setShowRestoreSessionPrompt] = useState(false);
    const [loadedSessionData, setLoadedSessionData] = useState(null);
    const [confirmReset, setConfirmReset] = useState(false);

    // --- Edit Session State ---
    const [editSessionDateInput, setEditSessionDateInput] = useState('');
    const [editSessionTimeInput, setEditSessionTimeInput] = useState('');
    const [editSessionMessage, setEditSessionMessage] = useState('');

    // --- Restore From ID State ---
    const [restoreUserIdInput, setRestoreUserIdInput] = useState('');
    const [showRestoreFromIdPrompt, setShowRestoreFromIdPrompt] = useState(false);
    const [restoreFromIdMessage, setRestoreFromIdMessage] = useState('');

    return {
        showReasonModal, setShowReasonModal,
        reasonForRemoval, setReasonForRemoval,
        tempEndTime, setTempEndTime,
        tempStartTime, setTempStartTime,
        showRestoreSessionPrompt, setShowRestoreSessionPrompt,
        loadedSessionData, setLoadedSessionData,
        confirmReset, setConfirmReset,
        editSessionDateInput, setEditSessionDateInput,
        editSessionTimeInput, setEditSessionTimeInput,
        editSessionMessage, setEditSessionMessage,
        restoreUserIdInput, setRestoreUserIdInput,
        showRestoreFromIdPrompt, setShowRestoreFromIdPrompt,
        restoreFromIdMessage, setRestoreFromIdMessage
    };
}