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
      <main>
        {/* Enhanced title with glass effect */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4 glass-float">
            Welcome to ChastityOS Dashboard
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
        </div>

        {/* Feature cards with enhanced spacing and glass effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Link
            to="/chastity-tracking"
            className="transform transition-transform hover:scale-[1.02]"
          >
            <FeatureCard
              title="Chastity Tracker"
              description={`Current Session: ${sessionDuration}`}
              accentColor="orange"
            />
          </Link>
          <Link
            to="/log-event"
            className="transform transition-transform hover:scale-[1.02]"
          >
            <FeatureCard
              title="Log Event"
              description="Record new events"
              accentColor="purple"
            />
          </Link>
          <Link
            to="/tasks"
            className="transform transition-transform hover:scale-[1.02]"
          >
            <FeatureCard
              title="Tasks"
              description="View upcoming tasks"
              accentColor="purple"
            />
          </Link>
          <Link
            to="/full-report"
            className="transform transition-transform hover:scale-[1.02]"
          >
            <FeatureCard
              title="Full Report"
              description="Analyze your journey"
              accentColor="orange"
            />
          </Link>
        </div>

        {/* Achievement Dashboard */}
        {user && (
          <div className="mt-12">
            <AchievementDashboard />
          </div>
        )}

        {/* TODO: Dexie Offline Demo temporarily disabled due to architectural restrictions */}
        {/* <div className="mb-8">
          <div className="glass-card">
            <DexieDemo />
          </div>
        </div> */}

        {/* Enhanced Keyholder access button */}
        <div className="text-center">
          <Link to="/keyholder">
            <button className="glass-button bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white px-8 py-4 text-lg font-bold transition-all duration-300 hover:from-purple-500/90 hover:to-pink-500/90 shadow-xl hover:shadow-purple-500/25 transform hover:scale-105">
              View Keyholder Dashboard
            </button>
          </Link>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
