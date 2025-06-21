import React from 'react';
import KeyholderSection from '../components/settings/KeyholderSection';

// This component acts as a simple wrapper that receives the
// entire application state as props from App.jsx and passes it
// down to the section component that does the actual work.
export default function KeyholderPage(props) {
  return (
    <div className="container mx-auto p-4">
      {/* It spreads all received props into the KeyholderSection */}
      <KeyholderSection {...props} />
    </div>
  );
}
