// src/pages/SettingsPage.jsx
import React from 'react';
import DataManagementSection from '../components/settings/DataManagementSection.jsx';

const SettingsPage = (props) => {
  return (
    <div className="settings-container">
      {/* Data Management */}
      <DataManagementSection {...props} />
    </div>
  );
};

export default SettingsPage;