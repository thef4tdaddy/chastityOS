import React from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { FeedbackFAB } from "./components/feedback";

const Root: React.FC = () => {
  return (
    <AppLayout>
      <Outlet />
      <FeedbackFAB />
    </AppLayout>
  );
};

export default Root;
