import React, { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { SyncStatusIndicator } from "@/components/common";
import { useNavigationStore } from "@/stores";
import { ToastContainer } from "react-toastify";
import { useAuthState } from "../../contexts";
import { useAchievements } from "../../hooks/useAchievements";
import { AchievementNotification } from "../achievements";
import { BottomNavigation } from "../mobile";
import { useViewport } from "../../hooks/mobile";
import "react-toastify/dist/ReactToastify.css";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuthState();
  const { isMobile } = useViewport();

  // Achievement notifications
  const { unreadNotifications, allAchievements, markNotificationRead } =
    useAchievements(user?.uid);

  // Use navigation store with selective subscriptions for mobile menu state
  const isMobileMenuOpen = useNavigationStore(
    (state) => state.isMobileMenuOpen,
  );
  const toggleMobileMenu = useNavigationStore(
    (state) => state.toggleMobileMenu,
  );
  const closeMobileMenu = useNavigationStore((state) => state.closeMobileMenu);
  const setPageTitle = useNavigationStore((state) => state.setPageTitle);

  const navItems = useMemo(() => [
    { path: "/", label: "Dashboard" },
    { path: "/chastity-tracking", label: "Chastity Tracking" },
    { path: "/tasks", label: "Tasks" },
    { path: "/rewards-punishments", label: "Rewards/Punishments" },
    { path: "/full-report", label: "Full Report" },
    { path: "/settings", label: "Settings" },
    { path: "/achievements", label: "Achievements" },
    { path: "/log-event", label: "Log Event" },
  ], []);

  // Mobile bottom nav items (most important features)
  const mobileNavItems = [
    {
      path: "/",
      label: "Home",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      path: "/chastity-tracking",
      label: "Tracker",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      path: "/log-event",
      label: "Log",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
    },
    {
      path: "/tasks",
      label: "Tasks",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      path: "/settings",
      label: "Settings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navItems]); // setPageTitle omitted - Zustand store actions are stable

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // closeMobileMenu omitted - Zustand store actions are stable

  return (
    <div className="bg-dark_purple min-h-screen text-white font-inter">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-dark_purple border-b border-black safe-area-inset-top">
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
              className="md:hidden touch-target text-white p-2 hover:bg-tekhelet/20 rounded-md"
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
      <main
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? "pb-20" : ""}`}
      >
        <div className="min-h-[calc(100vh-12rem)]">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation items={mobileNavItems} />

      {/* Footer - Hidden on mobile when bottom nav is present */}
      <footer
        className={`border-t border-black bg-dark_purple ${isMobile ? "hidden" : ""}`}
      >
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
