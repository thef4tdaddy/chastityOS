// src/pages/SettingsPage.jsx
import React from 'react';
import DataManagementSection from '../components/settings/DataManagementSection.jsx';

const SettingsPage = (props) => {
  return (
    <div className="p-0 md:p-4">
      {/* Data Management */}
      <DataManagementSection {...props} />
    </div>
  );
};

export default SettingsPage;