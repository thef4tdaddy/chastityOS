// src/pages/FullReportPage.jsx
import React from 'react';
import CurrentStatusSection from '../components/full_report/CurrentStatusSection';
import TotalsSection from '../components/full_report/TotalsSection';
import ChastityHistoryTable from '../components/full_report/ChastityHistoryTable';
import EventLogTable from '../components/log_event/EventLogTable';

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
        <div className="app-wrapper">
            <div className="mb-4"><strong>Submissive’s Name:</strong> {savedSubmissivesName || '(Not Set)'}</div>
            {!savedSubmissivesName && userId && (
                <div className="mb-4"><strong>User ID:</strong> {userId}</div>
            )}
            {keyholderName && (
                <div className="mb-4"><strong>Keyholder:</strong> {keyholderName}</div>
            )}
            <hr className="section-divider"/>

            <CurrentStatusSection
                isCageOn={isCageOn}
                isPaused={isPaused}
                cageOnTime={cageOnTime}
                effectiveCurrentSessionTime={effectiveCurrentSessionTime}
                accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
                livePauseDuration={livePauseDuration}
                timeCageOff={timeCageOff}
            />
            <hr className="section-divider"/>

            <TotalsSection
                totalChastityTime={totalChastityTime}
                totalTimeCageOff={totalTimeCageOff}
                overallTotalPauseTime={overallTotalPauseTime}
            />
            <hr className="section-divider"/>

            <h3 className="section-title">Chastity History</h3>
            <ChastityHistoryTable chastityHistory={chastityHistory} />
            <hr className="section-divider"/>

            <h3 className="section-title">Sexual Events Log</h3>
            <EventLogTable
                isLoadingEvents={isLoadingEvents}
                sexualEventsLog={sexualEventsLog}
                savedSubmissivesName={savedSubmissivesName}
            />
        </div>
    );
};

export default FullReportPage;