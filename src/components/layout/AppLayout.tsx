import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useAuthState } from "../../contexts";
import { useAchievements } from "../../hooks/useAchievements";
import { AchievementNotification } from "../achievements";
import "react-toastify/dist/ReactToastify.css";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuthState();

  // Achievement notifications
  const { unreadNotifications, allAchievements, markNotificationRead } =
    useAchievements(user?.uid);

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/chastity-tracking", label: "Tracker" },
    { path: "/tasks", label: "Tasks" },
    { path: "/achievements", label: "Achievements" },
    { path: "/log-event", label: "Log Event" },
    { path: "/rewards-punishments", label: "Rewards" },
    { path: "/rules", label: "Rules" },
    { path: "/full-report", label: "Report" },
    { path: "/settings", label: "Settings" },
  ];

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Top Navigation */}
      <header className="border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-white">
              ChastityOS
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              {navItems.slice(1, -1).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-purple-600/20 text-purple-300"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Settings */}
              <Link
                to="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === "/settings"
                    ? "bg-purple-600/20 text-purple-300"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                Settings
              </Link>

              {/* Keyholder Access */}
              <Link
                to="/keyholder"
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                KH Access
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Internal Border */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 min-h-[calc(100vh-12rem)]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-gray-400 text-sm">
            <p>ChastityOS v4.0.0 | Privacy | Terms | Support</p>
          </div>
        </div>
      </footer>

      {/* Achievement Notifications */}
      {user && (
        <AchievementNotification
          notifications={unreadNotifications}
          achievements={allAchievements}
          onMarkRead={markNotificationRead}
        />
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={8000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="achievement-toast"
      />
    </div>
  );
};

export default AppLayout;
