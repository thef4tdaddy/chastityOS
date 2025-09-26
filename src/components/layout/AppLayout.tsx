import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { SyncStatusIndicator } from "@/components/common";
import { useNavigationStore } from "@/stores";
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

  // Use navigation store for mobile menu state
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, setPageTitle } =
    useNavigationStore();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/chastity-tracking", label: "Chastity Tracking" },
    { path: "/tasks", label: "Tasks" },
    { path: "/rewards-punishments", label: "Rewards/Punishments" },
    { path: "/full-report", label: "Full Report" },
    { path: "/settings", label: "Settings" },
    { path: "/achievements", label: "Achievements" },
    { path: "/log-event", label: "Log Event" },
  ];

  // Update page title based on current route
  useEffect(() => {
    const currentItem = navItems.find(
      (item) => item.path === location.pathname,
    );
    const title = currentItem
      ? `${currentItem.label} - ChastityOS`
      : "ChastityOS";
    setPageTitle(title);
  }, [location.pathname, setPageTitle]);

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  return (
    <div className="bg-dark_purple min-h-screen text-white font-inter">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-dark_purple border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-2xl font-bold text-white flex items-center space-x-2"
              >
                <span className="text-tekhelet">🔐</span>
                <span>ChastityOS</span>
              </Link>
              <SyncStatusIndicator />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems
                .filter((item) => item.path !== "/")
                .slice(0, 5)
                .map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      location.pathname === item.path
                        ? "text-white border-b-2 border-tekhelet bg-tekhelet/10"
                        : "text-lavender_web hover:text-white hover:bg-tekhelet/20"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

              {/* Settings */}
              <Link
                to="/settings"
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  location.pathname === "/settings"
                    ? "text-white border-b-2 border-tekhelet bg-tekhelet/10"
                    : "text-lavender_web hover:text-white hover:bg-tekhelet/20"
                }`}
              >
                Settings
              </Link>

              {/* KH Access Button */}
              <Link
                to="/keyholder"
                className="bg-tekhelet hover:bg-tekhelet-600 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200"
              >
                KH Access
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2 hover:bg-tekhelet/20 rounded-md"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
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
                  d={
                    isMobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-lavender_web-500/10 backdrop-blur rounded-lg mt-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      location.pathname === item.path
                        ? "bg-tekhelet text-white"
                        : "text-lavender_web hover:text-white hover:bg-tekhelet/20"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Mobile Keyholder Access */}
                <Link
                  to="/keyholder"
                  className="block bg-tekhelet hover:bg-tekhelet-600 text-white px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={closeMobileMenu}
                >
                  KH Access
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-h-[calc(100vh-12rem)]">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black bg-dark_purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-rose_quartz text-sm">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span>v4.0.0</span>
              <span className="hidden sm:inline">|</span>
              <Link
                to="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link to="#" className="hover:text-white transition-colors">
                Terms
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link
                to="/feedback"
                className="hover:text-white transition-colors"
              >
                Support
              </Link>
            </div>
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
