import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import {
  sessionDBService,
  eventDBService,
  taskDBService,
  goalDBService,
} from "../services/database";
import type { DBSession, DBEvent, DBTask, DBGoal } from "../types/database";
import { logger } from "../utils/logging";
import { FaSpinner } from "../utils/iconImport";
import {
  CurrentStatusSection,
  StatisticsSection,
  SessionHistorySection,
} from "../components/full_report";

// Component sections moved to /components/full_report/

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

        const [currentSessionData, sessionData, eventData, taskData, goalData] =
          await Promise.all([
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
        logger.error("Error fetching report data:", error, "FullReportPage");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="text-nightly-spring-green">
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
            <StatisticsSection
              sessions={sessions}
              events={events}
              tasks={tasks}
              goals={goals}
            />
            <SessionHistorySection sessions={sessions} />
          </>
        )}
      </div>
    </div>
  );
};

export default FullReportPage;
