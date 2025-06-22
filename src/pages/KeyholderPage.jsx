import React from 'react';
import KeyholderDashboard from '../components/keyholder/KeyholderDashboard.jsx';

// This page component acts as a container for the KeyholderDashboard,
// passing down all the necessary props from the main application state.
const KeyholderPage = (props) => {
  return (
    <div>
      <KeyholderDashboard {...props} />
    </div>
  );
};

export default KeyholderPage;
