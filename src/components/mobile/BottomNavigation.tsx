/**
 * Bottom Navigation Component
 * Mobile-first navigation bar that appears at the bottom of the screen
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useViewport } from "../../hooks/mobile/useViewport";
import { useHapticFeedback } from "../../hooks/mobile/useHapticFeedback";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface BottomNavigationProps {
  items: NavItem[];
  className?: string;
}

// Helper function to get navigation item styles
const getNavItemStyles = (isActive: boolean): string => {
  const baseStyles = `
    touch-target
    relative
    flex flex-col items-center justify-center
    px-3 py-2
    rounded-lg
    transition-all duration-200 ease-in-out
    min-h-[48px] min-w-[48px]
  `;
  
  const activeStyles = "text-white bg-tekhelet shadow-lg transform scale-105";
  const inactiveStyles = "text-lavender_web hover:text-white hover:bg-tekhelet/20";
  
  return `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
};

// Navigation Item Component
const NavigationItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onNavClick: () => void;
}> = ({ item, isActive, onNavClick }) => (
  <Link
    key={item.path}
    to={item.path}
    onClick={onNavClick}
    className={getNavItemStyles(isActive)}
  >
    {/* Icon */}
    <div
      className={`
        transition-transform duration-200
        ${isActive ? "scale-110" : "scale-100"}
      `}
    >
      {item.icon}
    </div>

    {/* Label */}
    <span
      className={`
        text-xs font-medium mt-1 leading-none
        transition-all duration-200
        ${isActive ? "text-white" : "text-lavender_web"}
      `}
    >
      {item.label}
    </span>

    {/* Badge */}
    {item.badge && item.badge > 0 && (
      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
        {item.badge > 99 ? "99+" : item.badge}
      </div>
    )}

    {/* Active indicator */}
    {isActive && (
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-pulse" />
    )}
  </Link>
);

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  className = "",
}) => {
  const location = useLocation();
  const { isMobile, safeAreaInsets } = useViewport();
  const { light } = useHapticFeedback();

  if (!isMobile) return null;

  const handleNavClick = () => {
    light();
  };

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-dark_purple/95 
        backdrop-blur-lg
        border-t border-tekhelet/20
        safe-area-inset-bottom
        ${className}
      `}
      style={{
        paddingBottom: safeAreaInsets.bottom,
      }}
    >
      <div className="flex justify-around items-center px-2 py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavigationItem
              key={item.path}
              item={item}
              isActive={isActive}
              onNavClick={handleNavClick}
            />
          );
        })}
      </div>

      {/* Visual separator line at top */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-tekhelet/30 to-transparent" />
    </nav>
  );
};

export default BottomNavigation;
