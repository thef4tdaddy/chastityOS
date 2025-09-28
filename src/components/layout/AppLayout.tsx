import React, { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { SyncStatusIndicator } from "@/components/common";
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

  // Using imported navItems from NavigationData

  // Using imported mobileNavItems from NavigationData

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
