import React from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";

const Root: React.FC = () => {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};

export default Root;
