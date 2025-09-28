import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigationStore } from "@/stores";
import { ToastContainer } from "react-toastify";
import { useAuthState } from "../../contexts";
import { useAchievements } from "../../hooks/useAchievements";
import { BottomNavigation } from "../mobile";
import { useViewport } from "../../hooks/mobile";
import { Header } from "./Header";
import { MobileMenu } from "./MobileMenu";
import { AchievementNotifications } from "./AchievementNotifications";
import { navItems, mobileNavItemsConfig } from "./NavigationData";
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

  // Create mobile navigation items with React elements from configuration
  const mobileNavItems = mobileNavItemsConfig.map((item) => ({
    ...item,
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
          d={item.iconPath}
        />
      </svg>
    ),
  }));

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
