// src/pages/SettingsPage.jsx
import React from 'react';
import AccountSection from '../components/settings/AccountSection';
import KeyholderSection from '../components/settings/KeyholderSection';
import DataManagementSection from '../components/settings/DataManagementSection';
import SessionEditSection from '../components/settings/SessionEditSection';

const SettingsPage = (props) => {
  // Pass all props down to each section using the spread operator.
  // This is a robust way to ensure all necessary data and handlers are available
  // to the components that need them, resolving the login display issue.
  return (
    <div className="p-0 md:p-4">
      <AccountSection {...props} />
      <KeyholderSection {...props} />
      <DataManagementSection {...props} />
      <SessionEditSection {...props} />
    </div>
  );
};

export default SettingsPage;
