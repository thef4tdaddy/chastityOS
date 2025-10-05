import React from "react";
import { useAuthState } from "../contexts";
import { useReportData } from "../hooks/api/useReportData";
import { useAccountLinking } from "../hooks/account-linking/useAccountLinking";
import { FaSpinner, FaUsers } from "../utils/iconImport";
import {
  CurrentStatusSection,
  StatisticsSection,
  SessionHistorySection,
} from "../components/full_report";

const FullReportPage: React.FC = () => {
  const { user } = useAuthState();
  const { adminRelationships } = useAccountLinking();

  // Get the active submissive relationship (first one for now)
  const activeSubmissive = adminRelationships?.[0];

  // Fetch report data for current user
  const userReport = useReportData(user?.uid);

  // Fetch report data for submissive if keyholder has one
  const submissiveReport = useReportData(activeSubmissive?.wearerId);

  const isLoading = userReport.isLoading || submissiveReport.isLoading;
  const error = userReport.error || submissiveReport.error;

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
        {/* Combined heading for keyholders */}
        {activeSubmissive && (
          <div className="glass-card mb-6 p-4">
            <div className="flex items-center gap-2">
              <FaUsers className="text-nightly-aquamarine text-xl" />
              <h2 className="text-xl font-semibold text-nightly-honeydew">
                Combined Report
              </h2>
            </div>
            <p className="text-sm text-nightly-celadon mt-2">
              Showing statistics for you and{" "}
              {activeSubmissive.wearerName || "your submissive"}
            </p>
          </div>
        )}

        {/* Your current status */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
            {activeSubmissive ? "Your Status" : "Current Status"}
          </h3>
          <CurrentStatusSection currentSession={userReport.currentSession} />
        </div>

        {/* Submissive's current status (if keyholder) */}
        {activeSubmissive && submissiveReport.currentSession && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-nightly-lavender-floral mb-4">
              {activeSubmissive.wearerName || "Submissive"}'s Status
            </h3>
            <CurrentStatusSection
              currentSession={submissiveReport.currentSession}
            />
          </div>
        )}

        {/* Combined statistics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
            {activeSubmissive ? "Your Statistics" : "Statistics"}
          </h3>
          <StatisticsSection
            sessions={userReport.sessions}
            events={userReport.events}
            tasks={userReport.tasks}
            goals={userReport.goals}
          />
        </div>

        {/* Submissive's statistics (if keyholder) */}
        {activeSubmissive && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-nightly-lavender-floral mb-4">
              {activeSubmissive.wearerName || "Submissive"}'s Statistics
            </h3>
            <StatisticsSection
              sessions={submissiveReport.sessions}
              events={submissiveReport.events}
              tasks={submissiveReport.tasks}
              goals={submissiveReport.goals}
            />
          </div>
        )}

        {/* Combined session history */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
            {activeSubmissive ? "Your Session History" : "Session History"}
          </h3>
          <SessionHistorySection sessions={userReport.sessions} />
        </div>

        {/* Submissive's session history (if keyholder) */}
        {activeSubmissive && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-nightly-lavender-floral mb-4">
              {activeSubmissive.wearerName || "Submissive"}'s Session History
            </h3>
            <SessionHistorySection sessions={submissiveReport.sessions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FullReportPage;
