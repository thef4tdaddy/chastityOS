import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MobileDashboardLayout,
  DesktopDashboardLayout,
} from "../components/dashboard/DashboardLayouts";
import { AchievementDashboard } from "../components/achievements";
import { SessionPersistenceDemo } from "../components/demo/SessionPersistenceDemo";
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

        {/* Mobile and Desktop Layouts */}
        <MobileDashboardLayout sessionDuration={sessionDuration} />
        <DesktopDashboardLayout sessionDuration={sessionDuration} />

        {/* Achievement Dashboard */}
        {user && (
          <div className="mt-12">
            <AchievementDashboard />
          </div>
        )}

        {/* Session Persistence Demo */}
        <div className="mt-12">
          <SessionPersistenceDemo />
        </div>

        {/* TODO: Dexie Offline Demo temporarily disabled due to architectural restrictions */}
        {/* <div className="mb-8">
          <div className="glass-card">
            <DexieDemo />
          </div>
        </div> */}

        {/* Enhanced Keyholder access button */}
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
