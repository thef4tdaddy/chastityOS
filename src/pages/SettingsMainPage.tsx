import React from "react";
import { AccountSection } from "../components/settings/AccountSection";
import { DisplaySettingsSection } from "../components/settings/DisplaySettingsSection";
import { SessionEditSection } from "../components/settings/SessionEditSection";
import { PersonalGoalSection } from "../components/settings/PersonalGoalSection";
import { PublicProfileSection } from "../components/settings/PublicProfileSection";

const SettingsMainPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green p-4 space-y-6">
      <AccountSection />
      <DisplaySettingsSection />
      <PublicProfileSection />
      <PersonalGoalSection />
      <SessionEditSection />

      <div className="card bg-nightly-celadon shadow-xl mt-6">
        <div className="card-body">
          <h2 className="card-title">Data & Backup</h2>
          <p>Export, import, or reset all your application data.</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary bg-nightly-lavender-floral">
              Manage Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsMainPage;
