// src/pages/KeyholderPage.jsx
import React from 'react';
import KeyholderSection from '../components/settings/KeyholderSection';

const KeyholderPage = (props) => {
  return (
    <div className={`app-wrapper ${
      import.meta.env.VITE_NIGHTLY ? 'nightly-theme' : 'prod-theme'
    }`}>
      <div className="title-red bg-red-950 text-red-300 border border-red-500 rounded-lg p-4">
        <KeyholderSection {...props} />
      </div>
    </div>
  );
};

export default KeyholderPage;
