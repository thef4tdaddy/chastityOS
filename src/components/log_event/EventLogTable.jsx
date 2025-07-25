// src/components/log_event/EventLogTable.jsx
import React from 'react';
import { formatTime, formatElapsedTime } from '../../utils';
import { EVENT_TYPE_DEFINITIONS } from '../../event_types.js'; // Added import and .js extension

const EventLogTable = ({ isLoadingEvents, sexualEventsLog, savedSubmissivesName, eventDisplayMode }) => { // Added eventDisplayMode
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

    // Filter sexualEventsLog based on eventDisplayMode
    const filteredSexualEventsLog = sexualEventsLog.filter(event => {
        if (event.eventType === 'startTimeEdit') { // Session Edit events are always vanilla
            return true;
        }

        if (eventDisplayMode === 'kinky') {
            return true; // Show all user-selectable events in kinky mode
        } else { // vanilla mode
            // Check if any of the event's types are 'kinky'
            const isKinky = (event.types || []).some(type => {
                const typeDef = EVENT_TYPE_DEFINITIONS.find(def => def.name === type);
                return typeDef && typeDef.mode === 'kinky';
            });
            return !isKinky; // Only show non-kinky events in vanilla mode
        }
    });

    return (
        <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-3">Logged Events</h3>
            {isLoadingEvents ? <p className="text-purple-200">Loading events...</p> : filteredSexualEventsLog.length > 0 ? ( // Changed to filteredSexualEventsLog
                <div className="overflow-x-auto bg-gray-800 rounded-lg border border-purple-700"><table className="min-w-full divide-y divide-purple-700"><thead className="bg-gray-700"><tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Date & Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Type(s)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Duration</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Orgasm Count(s)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Notes</th>
                </tr></thead><tbody className="divide-y divide-purple-700">
                {filteredSexualEventsLog.map(event => ( // Changed to filteredSexualEventsLog
                    event.eventType === 'startTimeEdit' ? (
                        <tr key={event.id} className="hover:bg-purple-900/20">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatTime(event.eventTimestamp || event.timestamp, true)}</td>
                            <td className="px-4 py-3 text-sm text-purple-200">Start Time Edited</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">N/A</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">N/A</td>
                            <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">
                                {event.notes || `Old: ${event.oldStartTime ? formatTime(new Date(event.oldStartTime), true) : 'N/A'} → New: ${event.newStartTime ? formatTime(new Date(event.newStartTime), true) : 'N/A'}${event.editedBy ? ` (by ${event.editedBy})` : ''}`}
                            </td>
                        </tr>
                    ) : (
                        <tr key={event.id} className="hover:bg-purple-900/20">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatTime(event.eventTimestamp, true)}</td>
                            <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{formatEventTypesForDisplay(event.types, event.otherTypeDetail, savedSubmissivesName)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{event.durationSeconds ? formatElapsedTime(event.durationSeconds) : 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatOrgasmCounts(event.selfOrgasmAmount, event.partnerOrgasmAmount)}</td>
                            <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{event.notes}</td>
                        </tr>
                    )
                ))}</tbody></table></div>) : <p className="text-purple-200">No events logged yet.</p>}
        </div>
    );
};
export default EventLogTable;
