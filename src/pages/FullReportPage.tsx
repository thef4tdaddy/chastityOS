import React from "react";
import { useAuthState } from "../contexts";
import { useReportData } from "../hooks/api/useReportData";
import { FaSpinner } from "../utils/iconImport";
import {
  CurrentStatusSection,
  StatisticsSection,
  SessionHistorySection,
} from "../components/full_report";

const FullReportPage: React.FC = () => {
  const { user } = useAuthState();
  const { currentSession, sessions, events, tasks, goals, isLoading, error } =
    useReportData(user?.uid);

  if (isLoading) {
    return (
      <div className="text-nightly-spring-green">
        <div className="p-4 max-w-6xl mx-auto">
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
            <div className="text-nightly-celadon">Loading report...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-nightly-spring-green">
        <div className="p-4 max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="text-red-400">Error loading report data</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-nightly-spring-green">
      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        <CurrentStatusSection currentSession={currentSession} />
        <StatisticsSection
          sessions={sessions}
          events={events}
          tasks={tasks}
          goals={goals}
        />
        <SessionHistorySection sessions={sessions} />
      </div>
    </div>
  );
};

export default FullReportPage;
