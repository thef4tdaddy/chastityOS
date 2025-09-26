import React from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { FeedbackFAB } from "./components/feedback";
import NotificationContainer from "./components/ui/NotificationContainer";
const Root: React.FC = () => {
  return (
    <AppLayout>
      <Outlet />
      <FeedbackFAB />
      <NotificationContainer />
    </AppLayout>
  );
};

export default Root;
