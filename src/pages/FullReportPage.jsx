import React, { useState, useMemo } from 'react';
import { PAUSE_REASON_OPTIONS } from '../event_types.js';
import CurrentStatusSection from '../components/full_report/CurrentStatusSection';
import TotalsSection from '../components/full_report/TotalsSection';
import ChastityHistoryTable from '../components/full_report/ChastityHistoryTable';
import EventLogTable from '../components/log_event/EventLogTable';
import ArousalLevelChart from '../components/arousal/ArousalLevelChart';

const FullReportPage = ({
  savedSubmissivesName,
  userId,
  isCageOn,
  cageOnTime,
  timeInChastity,
  timeCageOff,
  totalChastityTime,
  totalTimeCageOff,
  chastityHistory,
  sexualEventsLog,
  isLoadingEvents,
  arousalLevels,
  isPaused,
  accumulatedPauseTimeThisSession,
  overallTotalPauseTime,
  keyholderName,
  livePauseDuration
}) => {
  const effectiveCurrentSessionTime = isCageOn
    ? Math.max(
        0,
        timeInChastity -
          accumulatedPauseTimeThisSession -
          (isPaused && livePauseDuration ? livePauseDuration : 0)
      )
    : 0;

  const [chartDays, setChartDays] = useState(7); // Default to 7 days for a cleaner look

  const pauseReasonTotals = useMemo(() => {
    const totals = {};
    chastityHistory.forEach(p => {
      (p.pauseEvents || []).forEach(ev => {
        if (!ev.duration || !ev.reason) return;
        const category = PAUSE_REASON_OPTIONS.includes(ev.reason)
          ? ev.reason
          : 'Other';
        totals[category] = (totals[category] || 0) + ev.duration;
      });
    });
    return totals;
  }, [chastityHistory]);

  return (
    <div className="app-wrapper">
      <div className="mb-4">
        <strong>Submissive’s Name:</strong> {savedSubmissivesName || '(Not Set)'}
      </div>
      {!savedSubmissivesName && userId && (
        <div className="mb-4">
          <strong>User ID:</strong> {userId}
        </div>
      )}
      {keyholderName && (
        <div className="mb-4">
          <strong>Keyholder:</strong> {keyholderName}
        </div>
      )}
      <hr className="section-divider" />

      <CurrentStatusSection
        isCageOn={isCageOn}
        isPaused={isPaused}
        cageOnTime={cageOnTime}
        effectiveCurrentSessionTime={effectiveCurrentSessionTime}
        accumulatedPauseTimeThisSession={accumulatedPauseTimeThisSession}
        livePauseDuration={livePauseDuration}
        timeCageOff={timeCageOff}
      />
      <hr className="section-divider" />

      {/* THIS IS THE CHANGE: A grid layout for Totals and Arousal History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="section-title">Totals & Statistics</h3>
          <TotalsSection
            totalChastityTime={totalChastityTime}
            totalTimeCageOff={totalTimeCageOff}
            overallTotalPauseTime={overallTotalPauseTime}
            pauseReasonTotals={pauseReasonTotals}
          />
        </div>
        <div>
          <h3 className="section-title">Arousal Level History</h3>
          <div className="mb-2 text-sm text-left">
            <label>
              Show past
              <input
                type="number"
                value={chartDays}
                onChange={e =>
                  setChartDays(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                min="1"
                max="30"
                className="ml-2 w-16 rounded-md text-black px-1"
              />
              days
            </label>
          </div>
          <ArousalLevelChart arousalLevels={arousalLevels} days={chartDays} />
        </div>
      </div>
      <hr className="section-divider" />

      <h3 className="section-title">Chastity History</h3>
      <ChastityHistoryTable chastityHistory={chastityHistory} />
      <hr className="section-divider" />

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
