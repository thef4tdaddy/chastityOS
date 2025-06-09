// src/pages/KeyholderPage.jsx
import React from 'react';
import KeyholderSection from '../components/settings/KeyholderSection';

const KeyholderPage = (props) => {
  return (
    <div className="p-0 md:p-4">
      <KeyholderSection {...props} />
    </div>
  );
};

export default KeyholderPage;
