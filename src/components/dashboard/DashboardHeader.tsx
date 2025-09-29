import React from "react";
import { Link } from "react-router-dom";

export const DashboardHeader: React.FC = () => {
  return (
    <header className="flex justify-between items-center mb-8">
      <div className="text-2xl font-bold">ChastityOS</div>
      {/* Hamburger menu for mobile, full nav for desktop */}
      <nav className="hidden md:flex space-x-4">
        <Link to="/chastity-tracking" className="hover:text-nightly-celadon">
          Chastity Tracking
        </Link>
        <a href="#" className="hover:text-nightly-celadon">
          Tasks
        </a>
        <a href="#" className="hover:text-nightly-celadon">
          Rewards/Punishments
        </a>
        <a href="#" className="hover:text-nightly-celadon">
          Full Report
        </a>
        <a href="#" className="hover:text-nightly-celadon">
          Settings
        </a>
        <a href="#" className="bg-nightly-lavender-floral px-3 py-1 rounded">
          KH Access
        </a>
      </nav>
      <div className="md:hidden">☰</div>
    </header>
  );
};
