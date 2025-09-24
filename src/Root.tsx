import React from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import NotificationContainer from "./components/ui/NotificationContainer";

const Root: React.FC = () => {
  return (
    <>
      <AppLayout>
        <Outlet />
      </AppLayout>
      <NotificationContainer />
    </>
  );
};

export default Root;
