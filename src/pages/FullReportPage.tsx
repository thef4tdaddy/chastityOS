import React from "react";
import { useAuthState } from "../contexts";
import { useReportData } from "../hooks/api/useReportData";
import { useAccountLinking } from "../hooks/account-linking/useAccountLinking";
import { FaUsers } from "../utils/iconImport";
import {
  CurrentStatusSection,
  StatisticsSection,
  SessionHistorySection,
  FullReportSkeleton,
} from "../components/full_report";
import { EventList } from "../components/log_event/EventList";
import { Card, Tooltip } from "@/components/ui";

// Error state component
const ErrorState: React.FC<{ hasSession: boolean }> = ({ hasSession }) => (
  <div className="text-nightly-spring-green">
    <div className="p-4 max-w-6xl mx-auto">
      <div className="text-center py-8">
        {hasSession ? (
          <div className="text-red-400">Error loading report data</div>
        ) : (
          <Card variant="glass" padding="lg">
            <h3 className="text-xl font-semibold text-nightly-honeydew mb-3">
              No Session Data Available
            </h3>
            <p className="text-nightly-celadon">
              Start your first chastity session to generate report data. Once
              you begin tracking, your statistics and history will appear here.
            </p>
          </Card>
        )}
      </div>
    </div>
  </div>
);

// Combined report header component
interface CombinedReportHeaderProps {
  activeSubmissive?: { wearerName?: string };
}

const CombinedReportHeader: React.FC<CombinedReportHeaderProps> = ({
  activeSubmissive,
}) => {
  if (!activeSubmissive) return null;

  return (
    <Card variant="glass" padding="sm" className="mb-6">
      <div className="flex items-center gap-2">
        <FaUsers className="text-nightly-aquamarine text-xl" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Combined Report
        </h2>
        <Tooltip content="This report includes data for both you and your submissive">
          <span className="text-nightly-aquamarine/60 cursor-help text-xs ml-1">
            ⓘ
          </span>
        </Tooltip>
      </div>
      <p className="text-sm text-nightly-celadon mt-2">
        Showing statistics for you and{" "}
        {activeSubmissive.wearerName || "your submissive"}
      </p>
    </Card>
  );
};

// User status section component
interface ReportSectionProps {
  activeSubmissive?: { wearerName?: string };
  userReport: ReturnType<typeof useReportData>;
  submissiveReport: ReturnType<typeof useReportData>;
}

const UserStatusSection: React.FC<ReportSectionProps> = ({
  activeSubmissive,
  userReport,
  submissiveReport,
}) => (
  <>
    <div className="mb-6 animate-fade-in-up">
      <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
        {activeSubmissive ? "Your Status" : "Current Status"}
      </h3>
      <CurrentStatusSection currentSession={userReport.currentSession} />
    </div>

    {activeSubmissive && submissiveReport.currentSession && (
      <div className="mb-6 animate-fade-in-up stagger-2">
        <h3 className="text-lg font-semibold text-nightly-lavender-floral mb-4">
          {activeSubmissive.wearerName || "Submissive"}'s Status
        </h3>
        <CurrentStatusSection
          currentSession={submissiveReport.currentSession}
        />
      </div>
    )}
  </>
);

// Statistics report section component
const StatisticsReportSection: React.FC<ReportSectionProps> = ({
  activeSubmissive,
  userReport,
  submissiveReport,
}) => (
  <>
    <div className="mb-6 animate-fade-in-up stagger-3">
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

    {activeSubmissive && (
      <div className="mb-6 animate-fade-in-up stagger-4">
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
  </>
);

// Session history report section component
const SessionHistoryReportSection: React.FC<ReportSectionProps> = ({
  activeSubmissive,
  userReport,
  submissiveReport,
}) => (
  <>
    <div className="mb-6 animate-fade-in-up stagger-5">
      <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
        {activeSubmissive ? "Your Session History" : "Session History"}
      </h3>
      <SessionHistorySection sessions={userReport.sessions} />
    </div>

    {activeSubmissive && (
      <div className="mb-6 animate-fade-in-up stagger-6">
        <h3 className="text-lg font-semibold text-nightly-lavender-floral mb-4">
          {activeSubmissive.wearerName || "Submissive"}'s Session History
        </h3>
        <SessionHistorySection sessions={submissiveReport.sessions} />
      </div>
    )}
  </>
);

// Event history report section component
const EventHistoryReportSection: React.FC<ReportSectionProps> = ({
  activeSubmissive,
  userReport,
  submissiveReport,
}) => (
  <>
    <div className="mb-6 animate-fade-in-up stagger-7">
      <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
        {activeSubmissive ? "Your Events" : "Event History"}
      </h3>
      <EventList events={userReport.events} />
    </div>

    {activeSubmissive && submissiveReport.events.length > 0 && (
      <div className="mb-6 animate-fade-in-up stagger-8">
        <h3 className="text-lg font-semibold text-nightly-lavender-floral mb-4">
          {activeSubmissive.wearerName || "Submissive"}'s Events
        </h3>
        <EventList events={submissiveReport.events} />
      </div>
    )}
  </>
);

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
    return <FullReportSkeleton />;
  }

  if (error) {
    const hasSession =
      !!userReport.currentSession || !!submissiveReport.currentSession;
    return <ErrorState hasSession={hasSession} />;
  }

  return (
    <div className="text-nightly-spring-green">
      <div className="p-4 max-w-6xl mx-auto">
        <CombinedReportHeader activeSubmissive={activeSubmissive} />
        <UserStatusSection
          activeSubmissive={activeSubmissive}
          userReport={userReport}
          submissiveReport={submissiveReport}
        />
        <StatisticsReportSection
          activeSubmissive={activeSubmissive}
          userReport={userReport}
          submissiveReport={submissiveReport}
        />
        <SessionHistoryReportSection
          activeSubmissive={activeSubmissive}
          userReport={userReport}
          submissiveReport={submissiveReport}
        />
        <EventHistoryReportSection
          activeSubmissive={activeSubmissive}
          userReport={userReport}
          submissiveReport={submissiveReport}
        />
      </div>
    </div>
  );
};

export default FullReportPage;
