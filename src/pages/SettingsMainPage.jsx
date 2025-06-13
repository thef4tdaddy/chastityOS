import React from 'react';
import AccountSection from '../components/settings/AccountSection.jsx';
import DisplaySettingsSection from '../components/settings/DisplaySettingsSection.jsx';
import PersonalGoalSection from '../components/settings/PersonalGoalSection.jsx';
import SessionEditSection from '../components/settings/SessionEditSection.jsx';

const SettingsMainPage = (props) => {
  return (
    <div className="p-0 md:p-4 space-y-6">
      <AccountSection {...props} />
      <DisplaySettingsSection {...props} />
      <PersonalGoalSection {...props} />
      <SessionEditSection {...props} sessionId={props.userId} />

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => props.setCurrentPage('syncData')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
        >
          Manage Data & Export
        </button>
      </div>
    </div>
  );
};

export default SettingsMainPage;