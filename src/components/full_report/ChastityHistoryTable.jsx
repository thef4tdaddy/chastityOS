// src/components/full_report/ChastityHistoryTable.jsx
import React from 'react';
import { formatTime, formatElapsedTime } from '../../utils';

const ChastityHistoryTable = ({ chastityHistory }) => {
    if (chastityHistory.length === 0) {
        return <p className="text-center text-purple-200">No chastity history records.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-purple-800">
                <thead className="bg-gray-700">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Start</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">End</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Raw Dur.</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Paused</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Effective</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Goal Set</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Difference</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-purple-300 uppercase">Reason</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-purple-700">
                    {chastityHistory.slice().reverse().map(p => {
                        const effectiveDuration = Math.max(0, (p.duration || 0) - (p.totalPauseDurationSeconds || 0));
                        const goalDurationForSession = p.goalDurationAtSessionStart;
                        const goalStatusDisplay = p.goalStatus || "N/A";
                        let goalDifferenceDisplay = "N/A";
                        if (goalDurationForSession !== null && goalDurationForSession > 0 && p.goalTimeDifference !== null) {
                            if (p.goalStatus === "Met") {
                                goalDifferenceDisplay = `Exceeded by ${formatElapsedTime(Math.abs(p.goalTimeDifference))}`;
                            } else if (p.goalStatus === "Not Met") {
                                goalDifferenceDisplay = `Short by ${formatElapsedTime(p.goalTimeDifference)}`;
                            }
                        }
                        return (
                            <tr key={p.id || (p.startTime ? p.startTime.toString() : Math.random())} className="hover:bg-purple-900/10">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{p.periodNumber}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatTime(p.startTime, true)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatTime(p.endTime, true)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{formatElapsedTime(p.duration)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-yellow-300">{formatElapsedTime(p.totalPauseDurationSeconds || 0)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-400 font-semibold">{formatElapsedTime(effectiveDuration)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-300">{goalDurationForSession ? formatElapsedTime(goalDurationForSession) : 'N/A'}</td>
                                <td className={`px-3 py-2 whitespace-nowrap text-sm font-semibold ${goalStatusDisplay === "Met" ? 'text-green-400' : (goalStatusDisplay === "Not Met" ? 'text-red-400' : 'text-purple-200')}`}>{goalStatusDisplay}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-purple-200">{goalDifferenceDisplay}</td>
                                <td className="px-3 py-2 whitespace-pre-wrap text-sm text-purple-200 break-words max-w-xs">{p.reasonForRemoval}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ChastityHistoryTable;