// src/pages/SettingsPage.jsx
import React from 'react';
import AccountSection from '../components/settings/AccountSection.jsx';
import DataManagementSection from '../components/settings/DataManagementSection.jsx';
import SessionEditSection from '../components/settings/SessionEditSection.jsx';
import DisplaySettingsSection from '../components/settings/DisplaySettingsSection.jsx';
import PersonalGoalSection from '../components/settings/PersonalGoalSection.jsx';

const SettingsPage = (props) => {
  return (
    <div className="p-0 md:p-4">
      {/* 1. Profile */}
      <AccountSection {...props} />
      {/* 2. Display Settings */}
      <DisplaySettingsSection {...props} />
      {/* 3. Personal Goal */}
      <PersonalGoalSection {...props} />
      {/* 4. Edit Chastity Time */}
      <SessionEditSection {...props} sessionId={props.userId} />
      {/* 5. Data Management */}
      <DataManagementSection {...props} />
    </div>
  );
};

export default SettingsPage