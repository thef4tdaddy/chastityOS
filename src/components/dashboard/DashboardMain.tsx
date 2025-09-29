import React from "react";
import { Link } from "react-router-dom";
import { FeatureCard } from "./FeatureCard";

interface DashboardMainProps {
  sessionDuration: string;
}

export const DashboardMain: React.FC<DashboardMainProps> = ({
  sessionDuration,
}) => {
  return (
    <main>
      <h1 className="text-4xl font-bold text-center mb-8 text-white">
        Welcome to ChastityOS Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

      <div className="text-center mt-8">
        <Link to="/keyholder">
          <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition-colors">
            View Keyholder Dashboard
          </button>
        </Link>
      </div>
    </main>
  );
};
