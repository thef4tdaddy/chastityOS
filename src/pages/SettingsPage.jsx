// src/pages/SettingsPage.jsx
import React from 'react';
import AccountSection from '../components/settings/AccountSection.jsx'; // Added .jsx
import DataManagementSection from '../components/settings/DataManagementSection.jsx'; // Added .jsx
import SessionEditSection from '../components/settings/SessionEditSection.jsx'; // Added .jsx
import DisplaySettingsSection from '../components/settings/DisplaySettingsSection.jsx'; // Added .jsx

const SettingsPage = (props) => {
  return (
    <div className="p-0 md:p-4">
      {/* 1. Profile */}
      <AccountSection {...props} />
      {/* 2. Display Settings */}
      <DisplaySettingsSection {...props} />
      {/* 3. Edit Chastity Time */}
      <SessionEditSection {...props} sessionId={props.userId} />
      {/* 4. Data Management */}
      <DataManagementSection {...props} />
    </div>
  );
};

export default SettingsPage;
