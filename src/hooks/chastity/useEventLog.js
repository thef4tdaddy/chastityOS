// src/hooks/useEventLog.js
import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const useEventLog = (userId, isAuthReady) => {
    const [sexualEventsLog, setSexualEventsLog] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [eventLogMessage, setEventLogMessage] = useState('');

    // Form state
    const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10));
    const [newEventTime, setNewEventTime] = useState(new Date().toTimeString().slice(0, 5));
    const [selectedEventTypes, setSelectedEventTypes] = useState([]);
    const [otherEventTypeChecked, setOtherEventTypeChecked] = useState(false);
    const [otherEventTypeDetail, setOtherEventTypeDetail] = useState('');
    const [newEventNotes, setNewEventNotes] = useState('');
    const [newEventDurationHours, setNewEventDurationHours] = useState('');
    const [newEventDurationMinutes, setNewEventDurationMinutes] = useState('');
    const [newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount] = useState('');
    const [newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount] = useState('');

    const getEventsCollectionRef = useCallback((targetUserId = userId) => {
        if (!targetUserId) return null;
        return collection(db, "users", targetUserId, "sexualEventsLog");
    }, [userId]);

    const fetchEvents = useCallback(async (targetUserId = userId) => {
        if (!isAuthReady || !targetUserId) return;
        setIsLoadingEvents(true);
        const eventsColRef = getEventsCollectionRef(targetUserId);
        if (!eventsColRef) {
            setEventLogMessage("Error: Could not get event log reference.");
            setTimeout(() => setEventLogMessage(''), 3000);
            setIsLoadingEvents(false);
            return;
        }
        try {
            const q = query(eventsColRef, orderBy("eventTimestamp", "desc"));
            const querySnapshot = await getDocs(q);
            setSexualEventsLog(querySnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                eventTimestamp: d.data().eventTimestamp?.toDate() || d.data().timestamp?.toDate(),
                timestamp: d.data().timestamp?.toDate()
            })));
        } catch (error) {
            console.error("Error fetching events:", error);
            setEventLogMessage("Failed to load events.");
            setTimeout(() => setEventLogMessage(''), 3000);
        } finally {
            setIsLoadingEvents(false);
        }
    }, [isAuthReady, userId, getEventsCollectionRef]);

    useEffect(() => {
        if (isAuthReady && userId) {
            fetchEvents();
        }
    }, [isAuthReady, userId, fetchEvents]);

    const handleEventTypeChange = useCallback((type) => {
        setSelectedEventTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    }, []);

    const handleOtherEventTypeCheckChange = useCallback((e) => {
        setOtherEventTypeChecked(e.target.checked);
        if (!e.target.checked) {
            setOtherEventTypeDetail('');
        }
    }, []);

    const handleLogNewEvent = useCallback(async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!isAuthReady || !userId) {
            setEventLogMessage("Auth error.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }
        const finalEventTypes = [...selectedEventTypes];
        let finalOtherDetail = null;
        if (otherEventTypeChecked && otherEventTypeDetail.trim()) {
            finalOtherDetail = otherEventTypeDetail.trim();
        }
        if (finalEventTypes.length === 0 && !finalOtherDetail) {
            setEventLogMessage("Select type or specify 'Other'.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }
        const eventsColRef = getEventsCollectionRef();
        if (!eventsColRef) {
            setEventLogMessage("Event log ref error.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }
        const dateTimeString = `${newEventDate}T${newEventTime}`;
        const eventTimestamp = new Date(dateTimeString);
        if (isNaN(eventTimestamp.getTime())) {
            setEventLogMessage("Invalid date/time.");
            setTimeout(() => setEventLogMessage(''), 3000);
            return;
        }
        const durationHoursNum = parseInt(newEventDurationHours, 10) || 0;
        const durationMinutesNum = parseInt(newEventDurationMinutes, 10) || 0;
        const durationSeconds = (durationHoursNum * 3600) + (durationMinutesNum * 60);
        const selfOrgasmAmountNum = selectedEventTypes.includes("Orgasm (Self)") && newEventSelfOrgasmAmount ? parseInt(newEventSelfOrgasmAmount, 10) || null : null;
        const partnerOrgasmAmountNum = selectedEventTypes.includes("Orgasm (Partner)") && newEventPartnerOrgasmAmount ? parseInt(newEventPartnerOrgasmAmount, 10) || null : null;

        const newEventData = {
            eventTimestamp: Timestamp.fromDate(eventTimestamp),
            loggedAt: serverTimestamp(),
            types: finalEventTypes,
            otherTypeDetail: finalOtherDetail,
            notes: newEventNotes.trim(),
            durationSeconds: durationSeconds > 0 ? durationSeconds : null,
            selfOrgasmAmount: selfOrgasmAmountNum,
            partnerOrgasmAmount: partnerOrgasmAmountNum
        };

        try {
            setIsSubmitting(true);
            await addDoc(eventsColRef, newEventData);
            setEventLogMessage("Event logged!");
            setNewEventDate(new Date().toISOString().slice(0, 10));
            setNewEventTime(new Date().toTimeString().slice(0, 5));
            setSelectedEventTypes([]);
            setOtherEventTypeChecked(false);
            setOtherEventTypeDetail('');
            setNewEventNotes('');
            setNewEventDurationHours('');
            setNewEventDurationMinutes('');
            setNewEventSelfOrgasmAmount('');
            setNewEventPartnerOrgasmAmount('');
            fetchEvents();
        } catch (error) {
            console.error("Error logging new event:", error);
            setEventLogMessage("Failed to log. See console.");
        } finally {
            setIsSubmitting(false);
        }
        setTimeout(() => setEventLogMessage(''), 3000);
    }, [isAuthReady, userId, selectedEventTypes, otherEventTypeChecked, otherEventTypeDetail, newEventDate, newEventTime, newEventDurationHours, newEventDurationMinutes, newEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, newEventNotes, getEventsCollectionRef, fetchEvents, isSubmitting]);

    return {
        sexualEventsLog,
        isLoadingEvents,
        eventLogMessage,
        newEventDate, setNewEventDate,
        newEventTime, setNewEventTime,
        selectedEventTypes, setSelectedEventTypes,
        otherEventTypeChecked, setOtherEventTypeChecked,
        otherEventTypeDetail, setOtherEventTypeDetail,
        newEventNotes, setNewEventNotes,
        newEventDurationHours, setNewEventDurationHours,
        newEventDurationMinutes, setNewEventDurationMinutes,
        newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount,
        newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount,
        handleEventTypeChange,
        handleOtherEventTypeCheckChange,
        handleLogNewEvent,
        isSubmitting,
        fetchEvents,
        getEventsCollectionRef, // For reset function
        setSexualEventsLog // Expose setter for reset
    };
};
