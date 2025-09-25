import React from "react";
import AccountSection from "../components/settings/AccountSection";
import DisplaySettingsSection from "../components/settings/DisplaySettingsSection";
import SessionEditSection from "../components/settings/SessionEditSection";
import PersonalGoalSection from "../components/settings/PersonalGoalSection";
import PublicProfileSection from "../components/settings/PublicProfileSection";

const SettingsMainPage = (props) => {
  const { setCurrentPage } = props;

  const navigateToDataManagement = () => {
    if (setCurrentPage) {
      setCurrentPage("dataManagement");
    }
  };

  return (
    <div className="space-y-6">
      {/* All sections receive the necessary props from the main `chastityOS` object */}
      <AccountSection {...props} />
      <DisplaySettingsSection {...props} />
      <PublicProfileSection {...props} />
      <PersonalGoalSection {...props} />
      <SessionEditSection {...props} />

      <div className="card bg-base-100 shadow-xl mt-6">
        <div className="card-body">
          <h2 className="card-title">Data & Backup</h2>
          <p>Export, import, or reset all your application data.</p>
          <div className="card-actions justify-end">
            <button
              onClick={navigateToDataManagement}
              className="btn btn-primary"
            >
              Manage Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsMainPage;
