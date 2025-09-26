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
    { path: "/chastity-tracking", label: "Tracker" },
    { path: "/tasks", label: "Tasks" },
    { path: "/achievements", label: "Achievements" },
    { path: "/log-event", label: "Log Event" },
    { path: "/rewards-punishments", label: "Rewards" },
    { path: "/rules", label: "Rules" },
    { path: "/full-report", label: "Report" },
    { path: "/settings", label: "Settings" },
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
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white">
      {/* Top Navigation with Glass Morphism */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Sync Status */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-2xl font-bold text-white glass-float"
              >
                ChastityOS
              </Link>
              <SyncStatusIndicator />
            </div>

            {/* Desktop Navigation with Glass Pills */}
            <nav className="hidden md:flex space-x-3">
              {navItems.slice(1, -1).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`glass-nav text-sm font-medium transition-all duration-300 ${
                    location.pathname === item.path
                      ? "glass-card-primary text-blue-200 shadow-liquid"
                      : "text-gray-300 hover:text-white glass-hover"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Settings */}
              <Link
                to="/settings"
                className={`glass-nav text-sm font-medium transition-all duration-300 ${
                  location.pathname === "/settings"
                    ? "glass-card-primary text-blue-200 shadow-liquid"
                    : "text-gray-300 hover:text-white glass-hover"
                }`}
              >
                Settings
              </Link>

              {/* Keyholder Access - Special Glass Button */}
              <Link
                to="/keyholder"
                className="glass-button bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white font-medium transition-all duration-300 hover:from-purple-500/90 hover:to-pink-500/90 shadow-lg hover:shadow-purple-500/25"
              >
                KH Access
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white glass-button p-2"
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
              <div className="px-2 pt-2 pb-3 space-y-1 bg-black/20 backdrop-blur-sm rounded-lg mt-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      location.pathname === item.path
                        ? "bg-nightly-aquamarine/20 text-nightly-aquamarine"
                        : "text-nightly-celadon hover:text-nightly-spring-green hover:bg-white/10"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Mobile Keyholder Access */}
                <Link
                  to="/keyholder"
                  className="block bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={closeMobileMenu}
                >
                  KH Access
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area with Enhanced Glass Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-morphism p-8 min-h-[calc(100vh-12rem)] relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-20 blur-3xl"></div>
          </div>
          <div className="relative z-10">{children}</div>
        </div>
      </main>

      {/* Footer with Glass Effect */}
      <footer className="glass-header mt-8">
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
