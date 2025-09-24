
import React from 'react';
import { Outlet } from 'react-router-dom';

const Root: React.FC = () => {
  return (
    <div>
      {/* The header and footer will be part of the layout */}
      <Outlet />
    </div>
  );
};

export default Root;
