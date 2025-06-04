import React from 'react';
import { formatTime, formatElapsedTime, EVENT_TYPES } from '../utils'; // Adjust path if your utils.js is elsewhere

const LogEventPage = ({
    isAuthReady, newEventDate, setNewEventDate, newEventTime, setNewEventTime, 
    selectedEventTypes, handleEventTypeChange, otherEventTypeChecked, handleOtherEventTypeCheckChange,
    otherEventTypeDetail, setOtherEventTypeDetail,
    newEventNotes, setNewEventNotes, 
    newEventDurationHours, setNewEventDurationHours, newEventDurationMinutes, setNewEventDurationMinutes,
    newEventSelfOrgasmAmount, setNewEventSelfOrgasmAmount, newEventPartnerOrgasmAmount, setNewEventPartnerOrgasmAmount,
    handleLogNewEvent, eventLogMessage, isLoadingEvents, sexualEventsLog, savedSubmissivesName 
}) => {
    const formatEventTypesForDisplay = (types, otherDetail, subName) => {
        let displayTypes = types && types.length > 0 
            ? types.map(type => type === "Orgasm (Self)" && subName ? `Orgasm (${subName})` : type).join(', ') 
            : '';
        if (otherDetail) {
            displayTypes += (displayTypes ? ', ' : '') + `Other: ${otherDetail}`;
        }
        return displayTypes || 'N/A';
    };
     const formatOrgasmCounts = (selfAmount, partnerAmount) => {
        let parts = [];
        if (selfAmount) parts.push(`Self: ${selfAmount}`);
        if (partnerAmount) parts.push(`Partner: ${partnerAmount}`);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };

    const showSelfOrgasmAmountInput = selectedEventTypes.includes("Orgasm (Self)");
    const showPartnerOrgasmAmountInput = selectedEventTypes.includes("Orgasm (Partner)");

    return (
        <div className="p-0 md:p-4">
          {/* Page title is now rendered in App.jsx for consistency */}
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
                        {EVENT_TYPES.map(type => {
                            const displayLabel = type === "Orgasm (Self)" && savedSubmissivesName 
                                               ? `Orgasm (${savedSubmissivesName})` 
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
                        <label htmlFor="partnerOrgasmAmount" className="block text-sm font-medium text-purple-300 text-left">Partner Orgasm Count:</label>
                        <input type="number" id="partnerOrgasmAmount" value={newEventPartnerOrgasmAmount} onChange={e => setNewEventPartnerOrgasmAmount(e.target.value)} min="1" placeholder="Count"
                               className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                )}
                <div><label htmlFor="eventNotes" className="block text-sm font-medium text-purple-300 text-left">Notes:</label><textarea id="eventNotes" value={newEventNotes} onChange={e => setNewEventNotes(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 rounded-md border border-purple-600 bg-gray-900 text-gray-50 focus:ring-purple-500 focus:border-purple-500" placeholder="Optional details..."></textarea></div>
                <button type="submit" disabled={!isAuthReady || isLoadingEvents} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-300 disabled:opacity-50">Log Event</button>
                {eventLogMessage && <p className={`text-sm mt-2 ${eventLogMessage.includes('success') ? 'text-green-400' : 'text-red-500'}`}>{eventLogMessage}</p>}
            </form>
            <h3 className="text-xl font-semibold text-purple-300 mb-3">Logged Events</h3>
            {isLoadingEvents ? <p className="text-purple-200">Loading events...</p> : sexualEventsLog.length > 0 ? (
                <div className="overflow-x-auto bg-gray-800 rounded-lg border border-purple-700"><table className="min-w-full divide-y divide-purple-700"><thead className="bg-gray-700"><tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Date & Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Type(s)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Duration</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Orgasm Count(s)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Notes</th>
                </tr></thead><tbody className="divide-y divide-purple-700">
                {sexualEventsLog.map(event => (<tr key={event.id} className="hover:bg-purple-900/20">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatTime(event.eventTimestamp, true)}</td>
                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{formatEventTypesForDisplay(event.types, event.otherTypeDetail, savedSubmissivesName)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{event.durationSeconds ? formatElapsedTime(event.durationSeconds) : 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatOrgasmCounts(event.selfOrgasmAmount, event.partnerOrgasmAmount)}</td>
                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{event.notes}</td>
                </tr>))}</tbody></table></div>) : <p className="text-purple-200">No events logged yet.</p>}
        </div>
    );
};

export default LogEventPage;
