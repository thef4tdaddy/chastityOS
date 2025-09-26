import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FeatureCard } from "../components/dashboard/FeatureCard";
import { AchievementDashboard } from "../components/achievements";
// TODO: DexieDemo temporarily disabled due to architectural restrictions
// import { DexieDemo } from "../components/common";
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
      <main className="font-inter">
        {/* Dashboard title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Dashboard
          </h1>
        </div>

        {/* Mobile Layout (single column) */}
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

        {/* Desktop/Tablet Layout (2x2 grid) */}
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

        {/* Achievement Dashboard */}
        {user && (
          <div className="mt-12">
            <AchievementDashboard />
          </div>
        )}

        {/* View Keyholder Dashboard button */}
        <div className="text-center mt-8">
          <Link to="/keyholder">
            <button className="bg-tekhelet hover:bg-tekhelet-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              View Keyholder Dashboard
            </button>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
