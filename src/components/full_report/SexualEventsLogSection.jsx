// src/components/full_report/SexualEventsLogSection.jsx
import React from 'react';
import { formatTime, formatElapsedTime } from '../../utils';

const SexualEventsLogSection = ({ isLoadingEvents, sexualEventsLog, savedSubmissivesName, keyholderName }) => {
    const formatEventTypesForDisplay = (types, otherDetail, subName, khName) => {
        let displayTypes = types && types.length > 0
            ? types.map(type => {
                if (type === "Orgasm (Self)" && subName) return `Orgasm (${subName})`;
                if (type === "Orgasm (Partner)" && khName) return `Orgasm (${khName})`;
                return type;
              }).join(', ')
            : '';
        if (otherDetail) {
            displayTypes += (displayTypes ? ', ' : '') + `Other: ${otherDetail}`;
        }
        return displayTypes || 'N/A';
    };
    const formatOrgasmCounts = (selfAmount, partnerAmount, subName, khName) => {
        let parts = [];
        if (selfAmount) parts.push(`${subName || 'Self'}: ${selfAmount}`);
        if (partnerAmount) parts.push(`${khName || 'Partner'}: ${partnerAmount}`);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };

    if (isLoadingEvents) {
        return <p className="text-purple-200 text-center">Loading events...</p>;
    }
    if (sexualEventsLog.length === 0) {
        return <p className="text-purple-200 text-center">No sexual events logged yet.</p>;
    }

    return (
        <div className="overflow-x-auto bg-gray-800 rounded-lg border border-purple-700">
            <table className="min-w-full divide-y divide-purple-700">
                <thead className="bg-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Date & Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Type(s)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Duration</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Orgasm Count(s)</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">Notes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-purple-700">
                    {sexualEventsLog.map(event => (
                        <tr key={event.id} className="hover:bg-purple-900/20">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatTime(event.eventTimestamp, true)}</td>
                            <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{formatEventTypesForDisplay(event.types, event.otherTypeDetail, savedSubmissivesName, keyholderName)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{event.durationSeconds ? formatElapsedTime(event.durationSeconds) : 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">{formatOrgasmCounts(event.selfOrgasmAmount, event.partnerOrgasmAmount, savedSubmissivesName, keyholderName)}</td>
                            <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">{event.notes || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
export default SexualEventsLogSection;