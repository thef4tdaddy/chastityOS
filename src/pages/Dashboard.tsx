import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Link } from "react-router-dom";
import {
  MobileDashboardLayout,
  DesktopDashboardLayout,
} from "../components/dashboard/DashboardLayouts";
import { AchievementDashboard } from "../components/achievements";
import { KeyholderDashboard } from "../components/keyholder";
// TODO: SessionPersistenceDemo and DexieDemo temporarily disabled due to architectural restrictions
// import { SessionPersistenceDemo } from "../components/demo/SessionPersistenceDemo";
// import { DexieDemo } from "../components/common";
import { sessionDBService } from "../services/database";
import { useAuthState } from "../contexts";
import { useAchievements } from "../hooks/useAchievements";
import { useAccountLinking } from "../hooks/account-linking/useAccountLinking";

const Dashboard: React.FC = () => {
  const { user } = useAuthState();
  const { keyholderRelationships } = useAccountLinking();
  const [sessionDuration, setSessionDuration] = useState("0s");
  const { userAchievements } = useAchievements(user?.uid);

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

  // Check if user is a keyholder
  const isKeyholder =
    keyholderRelationships && keyholderRelationships.length > 0;

  return (
    <>
      <main className="font-inter text-nightly-spring-green">
        {/* Dashboard logo and title */}
        <div className="flex items-center justify-center mb-8">
          <img
            src="/assets/logo/chastityOS-newlogo-text.svg"
            alt="ChastityOS"
            className="h-[60px] md:h-[72px]"
          />
          <h1
            className="text-4xl md:text-5xl font-bold ml-6 text-tekhelet"
            style={{ textShadow: "none" }}
          >
            Dashboard
          </h1>
        </div>

        {/* Show KeyholderDashboard if user is a keyholder, otherwise show regular dashboard */}
        {isKeyholder ? (
          <div className="max-w-6xl mx-auto px-4">
            <KeyholderDashboard keyholderUserId={user?.uid} />
          </div>
        ) : (
          <>
            {/* Mobile and Desktop Layouts */}
            <MobileDashboardLayout sessionDuration={sessionDuration} />
            <DesktopDashboardLayout sessionDuration={sessionDuration} />
          </>
        )}

        {/* Achievement Dashboard - only show if user has achievements and not a keyholder */}
        {!isKeyholder &&
          user &&
          userAchievements &&
          userAchievements.length > 0 && (
            <div className="mt-12">
              <AchievementDashboard />
            </div>
          )}

        {/* TODO: Session Persistence Demo - moved to showcase/demo section */}
        {/* <div className="mt-12">
          <SessionPersistenceDemo />
        </div> */}

        {/* TODO: Dexie Offline Demo temporarily disabled due to architectural restrictions */}
        {/* <div className="mb-8">
          <div className="glass-card">
            <DexieDemo />
          </div>
        </div> */}

        {/* Enhanced Keyholder access button - only show for non-keyholders */}
        {!isKeyholder && (
          <div className="text-center mt-8">
            <Link to="/keyholder">
              <Button className="bg-tekhelet hover:bg-tekhelet-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200">
                View Keyholder Dashboard
              </Button>
            </Link>
          </div>
        )}
      </main>
    </>
  );
};

export default Dashboard;
