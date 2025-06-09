// src/pages/FullReportPage.jsx
import React from 'react';
import CurrentStatusSection from '../components/full_report/CurrentStatusSection';
import TotalsSection from '../components/full_report/TotalsSection';
import ChastityHistoryTable from '../components/full_report/ChastityHistoryTable';
import SexualEventsLogSection from '../components/full_report/SessionEventLogSection';
import SessionEventLogSection from '../components/full_report/SessionEventLogSection';

const FullReportPage = ({
    savedSubmissivesName, userId, isCageOn, cageOnTime, timeInChastity, timeCageOff,
    totalChastityTime, totalTimeCageOff, chastityHistory, sexualEventsLog, isLoadingEvents,
    isPaused, accumulatedPauseTimeThisSession,
    overallTotalPauseTime,
    keyholderName,
    livePauseDuration
}) => {
    const effectiveCurrentSessionTime = isCageOn
        ? Math.max(0, timeInChastity - accumulatedPauseTimeThisSession - (isPaused && livePauseDuration ? livePauseDuration : 0))
        : 0;

    return (
        <div className="text-left text-purple-200 p-4 bg-gray-800 rounded-lg border border-purple-700">
            <div className="mb-4"><strong>Submissive’s Name:</strong> {savedSubmissivesName || '(Not Set)'}</div>
            {!savedSubmissivesName && userId && (
                <div className="mb-4"><strong>User ID:</strong> {userId}</div>
            )}
            {keyholderName && (
                <div className="mb-4"><strong>Keyholder:</strong> {keyholderName}</div>
            )}
            <hr className="my-3 border-purple-700"/>

            <CurrentStatusSection
                isCageOn={isCageOn}
                isPaused={isPaused}
                cageOnTime={cageOnTime}
                effectiveCurrentSessionTime={effectiveCurrentSessionTime}
                accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
                livePauseDuration={livePauseDuration}
                timeCageOff={timeCageOff}
            />
            <hr className="my-3 border-purple-700"/>

            <TotalsSection
                totalChastityTime={totalChastityTime}
                totalTimeCageOff={totalTimeCageOff}
                overallTotalPauseTime={overallTotalPauseTime}
            />
            <hr className="my-3 border-purple-700"/>

            <h3 className="text-xl font-semibold text-purple-300 mb-2 text-center">Chastity History</h3>
            <ChastityHistoryTable chastityHistory={chastityHistory} />
            <hr className="my-3 border-purple-700"/>

            <h3 className="text-xl font-semibold text-purple-300 mt-4 mb-2 text-center">Sexual Events Log</h3>
            <SexualEventsLogSection
                isLoadingEvents={isLoadingEvents}
                sexualEventsLog={sexualEventsLog}
                savedSubmissivesName={savedSubmissivesName}
                keyholderName={keyholderName}
            />
            <h3 className="text-xl font-semibold text-orange-300 mt-8 mb-2 text-center">Session Event Log</h3>
            <SessionEventLogSection
              isLoadingEvents={isLoadingEvents}
              eventLog={sexualEventsLog}
            />
        </div>
    );
};

export default FullReportPage;