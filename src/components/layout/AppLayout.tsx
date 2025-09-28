<<<<<<< HEAD
import React, { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { SyncStatusIndicator } from "@/components/common";
=======
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
>>>>>>> origin/nightly
import { useNavigationStore } from "@/stores";
import { ToastContainer } from "react-toastify";
import { useAuthState } from "../../contexts";
import { useAchievements } from "../../hooks/useAchievements";
import { BottomNavigation } from "../mobile";
import { useViewport } from "../../hooks/mobile";
import { Header } from "./Header";
import { MobileMenu } from "./MobileMenu";
import { AchievementNotifications } from "./AchievementNotifications";
import { navItems, mobileNavItems } from "./NavigationData";
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

  // Navigation store subscriptions
  const isMobileMenuOpen = useNavigationStore(
    (state) => state.isMobileMenuOpen,
  );
  const toggleMobileMenu = useNavigationStore(
    (state) => state.toggleMobileMenu,
  );
  const closeMobileMenu = useNavigationStore((state) => state.closeMobileMenu);
  const setPageTitle = useNavigationStore((state) => state.setPageTitle);

<<<<<<< HEAD
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

=======
>>>>>>> origin/nightly
  // Update page title based on current route
  useEffect(() => {
    const currentItem = navItems.find(
      (item) => item.path === location.pathname,
    );
    const title = currentItem
      ? `${currentItem.label} - ChastityOS`
      : "ChastityOS";
    setPageTitle(title);
<<<<<<< HEAD
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navItems]); // setPageTitle omitted - Zustand store actions are stable
=======
  }, [location.pathname, setPageTitle]);
>>>>>>> origin/nightly

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
<<<<<<< HEAD
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // closeMobileMenu omitted - Zustand store actions are stable
=======
  }, [location.pathname, closeMobileMenu]);
>>>>>>> origin/nightly

  return (
    <div className="bg-dark_purple min-h-screen text-white font-inter">
      <Header
        navItems={navItems}
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
      />

      <MobileMenu
        navItems={navItems}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />

      <main className="flex-1 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {isMobile && (
        <BottomNavigation
          items={mobileNavItems}
          currentPath={location.pathname}
        />
      )}

      <AchievementNotifications
        unreadNotifications={unreadNotifications}
        allAchievements={allAchievements}
        markNotificationRead={markNotificationRead}
      />

      <ToastContainer
        position="top-right"
        autoClose={5000}
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
