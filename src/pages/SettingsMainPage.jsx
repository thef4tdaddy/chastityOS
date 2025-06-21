import React from 'react';
import AccountSection from '../components/settings/AccountSection';
import DisplaySettingsSection from '../components/settings/DisplaySettingsSection';
import SessionEditSection from '../components/settings/SessionEditSection';
import PersonalGoalSection from '../components/settings/PersonalGoalSection';

// This component receives the 'setCurrentPage' function as a prop from App.jsx
const SettingsMainPage = (props) => {
    const { setCurrentPage } = props;

    // This handler will be called when the button is clicked.
    const navigateToDataManagement = () => {
        // It calls the setCurrentPage function with the correct page key.
        if (setCurrentPage) {
            setCurrentPage('dataManagement');
        }
    };

    return (
        <div className="space-y-6">
            {/* The other setting sections are passed all the props from App.jsx */}
            <AccountSection {...props} />
            <DisplaySettingsSection {...props} />
            <PersonalGoalSection {...props} />
            <SessionEditSection {...props} />
            
            {/* Data Management Section */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Data & Backup</h2>
                <p>Export, import, or reset all your application data.</p>
                <div className="card-actions justify-end">
                  {/* The onClick handler is now correctly wired up. */}
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
