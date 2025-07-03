import React, { useEffect, useState, useMemo } from 'react';
import { loadPublicProfile } from '../utils/publicProfile';
import { PAUSE_REASON_OPTIONS } from '../event_types.js';
import CurrentStatusSection from '../components/full_report/CurrentStatusSection';
import TotalsSection from '../components/full_report/TotalsSection';
import ChastityHistoryTable from '../components/full_report/ChastityHistoryTable';
import EventLogTable from '../components/log_event/EventLogTable';
import ArousalLevelChart from '../components/arousal/ArousalLevelChart';

const PublicProfilePage = ({ profileId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const d = await loadPublicProfile(profileId);
      setData(d);
      setLoading(false);
    })();
  }, [profileId]);

  const visibility = data?.settings?.publicStatsVisibility || {};

  const effectiveCurrentSessionTime = useMemo(() => {
    if (!data) return 0;
    const s = data.sessionData;
    return s.isCageOn
      ? Math.max(
          0,
          s.timeInChastity -
            s.accumulatedPauseTimeThisSession -
            (s.isPaused && s.livePauseDuration ? s.livePauseDuration : 0)
        )
      : 0;
  }, [data]);

  const pauseReasonTotals = useMemo(() => {
    if (!data) return {};
    const totals = {};
    (data.sessionData.chastityHistory || []).forEach((p) => {
      (p.pauseEvents || []).forEach((ev) => {
        if (!ev.duration || !ev.reason) return;
        const category = PAUSE_REASON_OPTIONS.includes(ev.reason)
          ? ev.reason
          : 'Other';
        totals[category] = (totals[category] || 0) + ev.duration;
      });
    });
    return totals;
  }, [data]);

  if (loading) return <div className="loading-fullscreen">Loading...</div>;
  if (!data || !data.settings?.publicProfileEnabled) {
    return (
      <div className="text-center p-6 text-purple-200">This public profile is not available.</div>
    );
  }

  const { settings, sessionData, events, arousalLevels } = data;

  return (
    <div className="app-wrapper">
      <h2 className="subpage-title no-border">{settings.submissivesName || 'User'}'s Public Stats</h2>
      {visibility.currentStatus && (
        <>
          <CurrentStatusSection
            isCageOn={sessionData.isCageOn}
            isPaused={sessionData.isPaused}
            cageOnTime={sessionData.cageOnTime}
            effectiveCurrentSessionTime={effectiveCurrentSessionTime}
            accumulatedPauseTimeThisSession={sessionData.accumulatedPauseTimeThisSession}
            livePauseDuration={sessionData.livePauseDuration}
            timeCageOff={sessionData.timeCageOff}
          />
          <hr className="section-divider" />
        </>
      )}
      {visibility.totals && (
        <>
          <TotalsSection
            totalChastityTime={sessionData.totalChastityTime}
            totalTimeCageOff={sessionData.totalTimeCageOff}
            overallTotalPauseTime={sessionData.overallTotalPauseTime}
            pauseReasonTotals={pauseReasonTotals}
          />
          <hr className="section-divider" />
        </>
      )}
      {visibility.arousalChart && (
        <>
          <h3 className="section-title">Arousal Level History</h3>
          <ArousalLevelChart arousalLevels={arousalLevels} days={30} />
          <hr className="section-divider" />
        </>
      )}
      {visibility.chastityHistory && (
        <>
          <h3 className="section-title">Chastity History</h3>
          <ChastityHistoryTable chastityHistory={sessionData.chastityHistory || []} />
          <hr className="section-divider" />
        </>
      )}
      {visibility.sexualEvents && (
        <>
          <h3 className="section-title">Sexual Events Log</h3>
          <EventLogTable
            isLoadingEvents={false}
            sexualEventsLog={events}
            savedSubmissivesName={settings.submissivesName}
            eventDisplayMode={settings.eventDisplayMode}
          />
        </>
      )}
    </div>
  );
};

export default PublicProfilePage;
