import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from '../contexts';
import { sessionDBService, eventDBService, taskDBService, goalDBService } from '../services/database';
import type { DBSession, DBEvent, DBTask, DBGoal } from '../types/database';
import { logger } from '../utils/logging';
import {
  FaArrowLeft,
  FaClock,
  FaPlay,
  FaPause,
  FaStop,
  FaTrophy,
  FaCalendar,
  FaChartBar,
  FaHistory,
  FaSpinner,
} from 'react-icons/fa';

// Current Status Section
const CurrentStatusSection: React.FC<{
  currentSession: DBSession | null;
}> = ({ currentSession }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };

  const getCurrentSessionDuration = () => {
    if (!currentSession) return 0;

    const startTime = currentSession.startTime.getTime();
    const now = currentTime.getTime();
    const totalDuration = Math.floor((now - startTime) / 1000);

    // Subtract accumulated pause time
    return Math.max(0, totalDuration - currentSession.accumulatedPauseTime);
  };

  const getSessionStatus = () => {
    if (!currentSession) return { status: 'No Active Session', icon: FaStop, color: 'text-gray-400' };
    if (currentSession.isPaused) return { status: 'Paused', icon: FaPause, color: 'text-yellow-400' };
    return { status: 'Active', icon: FaPlay, color: 'text-green-400' };
  };

  const sessionStatus = getSessionStatus();
  const StatusIcon = sessionStatus.icon;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaClock className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">Current Status</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Status */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <StatusIcon className={sessionStatus.color} />
            <span className={`text-lg font-medium ${sessionStatus.color}`}>
              {sessionStatus.status}
            </span>
          </div>
          {currentSession && (
            <>
              <div className="text-3xl font-mono text-nightly-honeydew mb-2">
                {formatDuration(getCurrentSessionDuration())}
              </div>
              <div className="text-sm text-nightly-celadon">
                Started: {currentSession.startTime.toLocaleDateString()} {currentSession.startTime.toLocaleTimeString()}
              </div>
              {currentSession.goalDuration && (
                <div className="text-sm text-nightly-celadon">
                  Goal: {formatDuration(currentSession.goalDuration)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Session Details */}
        <div className="space-y-3">
          {currentSession && (
            <>
              <div className="flex justify-between">
                <span className="text-nightly-celadon">Mode:</span>
                <span className="text-nightly-honeydew">
                  {currentSession.isHardcoreMode ? 'Hardcore' : 'Normal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-nightly-celadon">Pause Time:</span>
                <span className="text-nightly-honeydew">
                  {formatDuration(currentSession.accumulatedPauseTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-nightly-celadon">Keyholder Approval:</span>
                <span className="text-nightly-honeydew">
                  {currentSession.keyholderApprovalRequired ? 'Required' : 'Not Required'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Statistics Section
const StatisticsSection: React.FC<{
  sessions: DBSession[];
  events: DBEvent[];
  tasks: DBTask[];
  goals: DBGoal[];
}> = ({ sessions, events, tasks, goals }) => {
  const stats = useMemo(() => {
    const completedSessions = sessions.filter(s => s.endTime);
    const totalChastityTime = completedSessions.reduce((acc, session) => {
      if (session.endTime) {
        const duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
        return acc + Math.max(0, duration - session.accumulatedPauseTime);
      }
      return acc;
    }, 0);

    const totalPauseTime = sessions.reduce((acc, session) => acc + session.accumulatedPauseTime, 0);
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completedGoals = goals.filter(g => g.isCompleted).length;

    const longestSession = Math.max(...completedSessions.map(s => {
      if (s.endTime) {
        const duration = Math.floor((s.endTime.getTime() - s.startTime.getTime()) / 1000);
        return Math.max(0, duration - s.accumulatedPauseTime);
      }
      return 0;
    }), 0);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalChastityTime,
      totalPauseTime,
      completedTasks,
      completedGoals,
      longestSession,
      totalEvents: events.length,
    };
  }, [sessions, events, tasks, goals]);

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const statItems = [
    { label: 'Total Sessions', value: stats.totalSessions, icon: FaPlay },
    { label: 'Completed Sessions', value: stats.completedSessions, icon: FaStop },
    { label: 'Total Chastity Time', value: formatDuration(stats.totalChastityTime), icon: FaClock },
    { label: 'Total Pause Time', value: formatDuration(stats.totalPauseTime), icon: FaPause },
    { label: 'Longest Session', value: formatDuration(stats.longestSession), icon: FaTrophy },
    { label: 'Completed Tasks', value: stats.completedTasks, icon: FaChartBar },
    { label: 'Completed Goals', value: stats.completedGoals, icon: FaTrophy },
    { label: 'Total Events', value: stats.totalEvents, icon: FaHistory },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaChartBar className="text-nightly-lavender-floral" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">Statistics</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="text-center">
              <Icon className="text-nightly-aquamarine text-2xl mb-2 mx-auto" />
              <div className="text-lg font-semibold text-nightly-honeydew mb-1">
                {item.value}
              </div>
              <div className="text-sm text-nightly-celadon">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Session History Section
const SessionHistorySection: React.FC<{ sessions: DBSession[] }> = ({ sessions }) => {
  const [showAll, setShowAll] = useState(false);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [sessions]);

  const displaySessions = showAll ? sortedSessions : sortedSessions.slice(0, 10);

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getSessionDuration = (session: DBSession) => {
    if (!session.endTime) return 0;
    const totalDuration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
    return Math.max(0, totalDuration - session.accumulatedPauseTime);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaHistory className="text-nightly-spring-green" />
          <h2 className="text-xl font-semibold text-nightly-honeydew">Session History</h2>
        </div>
        {sessions.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-nightly-aquamarine hover:text-nightly-spring-green transition-colors"
          >
            {showAll ? 'Show Less' : `Show All (${sessions.length})`}
          </button>
        )}
      </div>

      {displaySessions.length === 0 ? (
        <div className="text-center py-8">
          <FaCalendar className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
          <div className="text-nightly-celadon">No sessions found</div>
        </div>
      ) : (
        <div className="space-y-3">
          {displaySessions.map((session) => (
            <div key={session.id} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-nightly-honeydew">
                    {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    {session.endTime ? (
                      <>
                        Ended: {session.endTime.toLocaleDateString()} {session.endTime.toLocaleTimeString()}
                        {session.endReason && ` (${session.endReason})`}
                      </>
                    ) : (
                      'Active Session'
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-nightly-honeydew">
                    {session.endTime ? formatDuration(getSessionDuration(session)) : 'Ongoing'}
                  </div>
                  {session.accumulatedPauseTime > 0 && (
                    <div className="text-xs text-yellow-400">
                      Pause: {formatDuration(session.accumulatedPauseTime)}
                    </div>
                  )}
                </div>
              </div>

              {session.isHardcoreMode && (
                <span className="inline-block mt-2 bg-red-500/20 text-red-400 px-2 py-1 text-xs rounded">
                  Hardcore Mode
                </span>
              )}

              {session.notes && (
                <div className="mt-2 text-sm text-nightly-celadon">
                  Notes: {session.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FullReportPage: React.FC = () => {
  const { user } = useAuthState();
  const [currentSession, setCurrentSession] = useState<DBSession | null>(null);
  const [sessions, setSessions] = useState<DBSession[]>([]);
  const [events, setEvents] = useState<DBEvent[]>([]);
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [goals, setGoals] = useState<DBGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const [
          currentSessionData,
          sessionData,
          eventData,
          taskData,
          goalData,
        ] = await Promise.all([
          sessionDBService.getCurrentSession(user.uid),
          sessionDBService.findByUserId(user.uid),
          eventDBService.findByUserId(user.uid),
          taskDBService.findByUserId(user.uid),
          goalDBService.findByUserId(user.uid),
        ]);

        setCurrentSession(currentSessionData || null);
        setSessions(sessionData);
        setEvents(eventData);
        setTasks(taskData);
        setGoals(goalData);
      } catch (error) {
        logger.error('Error fetching report data:', error, 'FullReportPage');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-nightly-aquamarine hover:text-nightly-spring-green">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Full Report</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
            <div className="text-nightly-celadon">Loading report...</div>
          </div>
        ) : (
          <>
            <CurrentStatusSection currentSession={currentSession} />
            <StatisticsSection sessions={sessions} events={events} tasks={tasks} goals={goals} />
            <SessionHistorySection sessions={sessions} />
          </>
        )}
      </div>
    </div>
  );
};

export default FullReportPage;