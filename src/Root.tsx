
import React from 'react';
import { Outlet } from 'react-router-dom';
import { FeedbackFAB } from './components/feedback';

const Root: React.FC = () => {
  return (
    <div>
      {/* The header and footer will be part of the layout */}
      <Outlet />
      
      {/* Persistent Feedback FAB available on all pages */}
      <FeedbackFAB />
    </div>
  );
};

export default Root;
