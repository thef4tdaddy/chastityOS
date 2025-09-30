import React from "react";
import { Link } from "react-router-dom";
import { FeatureCard } from "./FeatureCard";

interface DashboardLayoutsProps {
  sessionDuration: string;
}

export const MobileDashboardLayout: React.FC<DashboardLayoutsProps> = ({
  sessionDuration,
}) => (
  <div className="block md:hidden space-y-6 mb-8">
    <Link to="/chastity-tracking" className="block">
      <FeatureCard
        title="Chastity Tracker"
        description={`Current Session: ${sessionDuration}`}
        accentColor="orange"
      />
    </Link>
    <Link to="/log-event" className="block">
      <FeatureCard
        title="Log Event"
        description="View upcoming tasks & goals"
        accentColor="purple"
      />
    </Link>
    <Link to="/full-report" className="block">
      <FeatureCard
        title="Full Report"
        description="Analyze your journey"
        accentColor="orange"
      />
    </Link>
  </div>
);

export const DesktopDashboardLayout: React.FC<DashboardLayoutsProps> = ({
  sessionDuration,
}) => (
  <div className="hidden md:block mb-8">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-white">
        Welcome to ChastityOS Dashboard
      </h2>
    </div>
    <div className="grid grid-cols-2 gap-6">
      <Link to="/chastity-tracking">
        <FeatureCard
          title="Chastity Tracker"
          description={`Current Session: ${sessionDuration}`}
          accentColor="orange"
        />
      </Link>
      <Link to="/log-event">
        <FeatureCard
          title="Log Event"
          description="Record new events"
          accentColor="purple"
        />
      </Link>
      <Link to="/tasks">
        <FeatureCard
          title="Tasks"
          description="View upcoming tasks"
          accentColor="purple"
        />
      </Link>
      <Link to="/full-report">
        <FeatureCard
          title="Full Report"
          description="Analyze your journey"
          accentColor="orange"
        />
      </Link>
    </div>
  </div>
);
