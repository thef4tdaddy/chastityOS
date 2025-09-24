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
      <h1 className="text-4xl font-bold text-center mb-8">
        Welcome to ChastityOS Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link to="/chastity-tracking">
          <FeatureCard
            title="Chastity Tracker"
            description={`Current Session: ${sessionDuration}`}
            accentColor="aquamarine"
          />
        </Link>

        <Link to="/log-event">
          <FeatureCard
            title="Log Event"
            description="Record your experiences and milestones"
            accentColor="lavender-floral"
          />
        </Link>

        <Link to="/tasks">
          <FeatureCard
            title="Tasks"
            description="View and manage your assigned tasks"
            accentColor="spring-green"
          />
        </Link>

        <Link to="/rewards">
          <FeatureCard
            title="Rewards & Punishments"
            description="Track your progress and consequences"
            accentColor="celadon"
          />
        </Link>

        <Link to="/full-report">
          <FeatureCard
            title="Full Report"
            description="Comprehensive view of your journey"
            accentColor="honeydew"
          />
        </Link>

        <Link to="/keyholder">
          <FeatureCard
            title="Keyholder Access"
            description="Administrative controls for keyholders"
            accentColor="lavender-floral"
          />
        </Link>
      </div>
    </main>
  );
};
