import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FeatureCard } from "../components/dashboard/FeatureCard";
import { AchievementDashboard } from "../components/achievements";
import { sessionDBService } from "../services/database";
import { useAuthState } from "../contexts";

const Dashboard: React.FC = () => {
  const { user } = useAuthState();
  const [sessionDuration, setSessionDuration] = useState("0s");

  useEffect(() => {
    if (user) {
      const fetchSession = async () => {
        const session = await sessionDBService.getCurrentSession(user.uid);
        if (session) {
          // This is a simplified duration calculation. A more robust solution would be needed.
          const duration = Math.floor(
            (new Date().getTime() - session.startTime.getTime()) / 1000,
          );
          setSessionDuration(`${duration}s`);
        }
      };
      fetchSession();
    }
  }, [user]);

  return (
    <>
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
              description="Record new events"
              accentColor="lavender-floral"
            />
          </Link>
          <Link to="/tasks">
            <FeatureCard
              title="Tasks"
              description="View upcoming tasks"
              accentColor="lavender-floral"
              className="hidden md:block"
            />
          </Link>
          <Link to="/full-report">
            <FeatureCard
              title="Full Report"
              description="Analyze your journey"
              accentColor="aquamarine"
            />
          </Link>
        </div>

        {/* Achievement Dashboard */}
        {user && (
          <div className="mt-12">
            <AchievementDashboard />
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/keyholder">
            <button className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-6 py-2 rounded-lg font-bold transition-colors">
              View Keyholder Dashboard
            </button>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
