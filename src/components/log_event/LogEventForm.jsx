// src/components/log_event/LogEventForm.jsx
import React from 'react';
import { EVENT_TYPE_DEFINITIONS } from '../../event_types.js'; // Changed import

const LogEventForm = ({
    isAuthReady, newEventDate, setNewEventDate, newEventTime, setNewEventTime,
    selectedEventTypes, handleEventTypeChange, otherEventTypeChecked, handleOtherEventTypeCheckChange,
    otherEventTypeDetail, setOtherEventTypeDetail,
    newEventNotes, setNewEventNotes,
    newEventDurationHours, setNewEventDurationHours, newEventDurationMinutes, setNewEventDurationMinutes,
    newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount,
    handleLogNewEvent, eventLogMessage, isLoadingEvents, savedSubmissivesName, keyholderName,
    eventDisplayMode // Added eventDisplayMode prop
}) => {
    const showSelfOrgasmAmountInput = selectedEventTypes.includes("Orgasm (Self)");
    const showPartnerOrgasmAmountInput = selectedEventTypes.includes("Orgasm (Partner)");

    // Filter event types based on userSelectable and current eventDisplayMode
    const filteredEventTypes = EVENT_TYPE_DEFINITIONS.filter(typeDef =>
        typeDef.userSelectable && (eventDisplayMode === 'kinky' || typeDef.mode === 'vanilla')
    );

    return (
        <form onSubmit={handleLogNewEvent} className="mb-8 p-4 bg-gray-800 rounded-lg border border-purple-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label htmlFor="eventDate" className="block text-sm font-medium text-purple-300 text-left">Event Date:</label><input type="date" id="eventDate" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/></div>
                <div><label htmlFor="eventTime" className="block text-sm font-medium text-purple-300 text-left">Event Time:</label><input type="time" id="eventTime" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} required className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/></div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="eventDurationHours" className="block text-sm font-medium text-purple-300 text-left">Duration (Hours):</label>
                    <input type="number" id="eventDurationHours" value={newEventDurationHours} onChange={e => setNewEventDurationHours(e.target.value)} min="0" placeholder="H"
                           className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                </div>
                <div>
                    <label htmlFor="eventDurationMinutes" className="block text-sm font-medium text-purple-300 text-left">Duration (Minutes):</label>
                    <input type="number" id="eventDurationMinutes" value={newEventDurationMinutes} onChange={e => setNewEventDurationMinutes(e.target.value)} min="0" max="59" placeholder="M"
                           className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-purple-300 text-left mb-1">Event Type(s):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {filteredEventTypes.map(typeDef => { // Changed to filteredEventTypes
                        const type = typeDef.name;
                        const displayLabel = type === "Orgasm (Self)" && savedSubmissivesName
                            ? `Orgasm (${savedSubmissivesName})`
                            : type === "Orgasm (Partner)" && keyholderName
                            ? `Orgasm (${keyholderName})`
                            : type;
                        return (
                            <label key={type} className="flex items-center space-x-2 text-sm text-purple-200">
                                <input type="checkbox" checked={selectedEventTypes.includes(type)} onChange={() => handleEventTypeChange(type)}
                                    className="form-checkbox h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"/>
                                <span>{displayLabel}</span>
                            </label>
                        );
                    })}
                    <label key="other" className="flex items-center space-x-2 text-sm text-purple-200">
                        <input type="checkbox" checked={otherEventTypeChecked} onChange={handleOtherEventTypeCheckChange}
                               className="form-checkbox h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"/>
                        <span>Other</span>
                    </label>
                </div>
                {otherEventTypeChecked && (
                    <input type="text" value={otherEventTypeDetail} onChange={e => setOtherEventTypeDetail(e.target.value)} placeholder="Specify other type"
                           className="mt-2 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500 text-sm"/>
                )}
            </div>
            {showSelfOrgasmAmountInput && (
                 <div>
                    <label htmlFor="selfOrgasmAmount" className="block text-sm font-medium text-purple-300 text-left">
                        {savedSubmissivesName ? `Orgasm (${savedSubmissivesName}) Count:` : "Orgasm (Self) Count:"}
                    </label>
                    <input type="number" id="selfOrgasmAmount" value={newEventSelfOrgasmAmount} onChange={e => setNewEventSelfOrgasmAmount(e.target.value)} min="1" placeholder="Count"
                           className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                </div>
            )}
            {showPartnerOrgasmAmountInput && (
                 <div>
                    <label htmlFor="partnerOrgasmAmount" className="block text-sm font-medium text-purple-300 text-left">
                        {keyholderName ? `Orgasm (${keyholderName}) Count:` : "Partner Orgasm Count:"}
                    </label>
                    <input type="number" id="partnerOrgasmAmount" value={newEventPartnerOrgasmAmount} onChange={e => setNewEventPartnerOrgasmAmount(e.target.value)} min="1" placeholder="Count"
                           className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                </div>
            )}
            <div><label htmlFor="eventNotes" className="block text-sm font-medium text-purple-300 text-left">Notes:</label><textarea id="eventNotes" value={newEventNotes} onChange={e => setNewEventNotes(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500" placeholder="Optional details..."></textarea></div>
            <button type="submit" disabled={!isAuthReady || isLoadingEvents} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50">Log Event</button>
            {eventLogMessage && <p className={`text-sm mt-2 ${eventLogMessage.includes('success') ? 'text-green-400' : 'text-red-500'}`}>{eventLogMessage}</p>}
        </form>
    );
};
export default LogEventForm;
