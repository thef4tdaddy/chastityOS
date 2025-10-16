import React from "react";
import { Link, useLocation } from "react-router-dom";
import { preloadRoute } from "@/utils/routing/routePreloader";

interface MobileMenuProps {
  navItems: Array<{ path: string; label: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  navItems,
  isOpen,
  onClose,
}) => {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      <div className="bg-dark_purple border-b border-black px-2 pt-2 pb-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            onTouchStart={() => preloadRoute(item.path)}
            onMouseEnter={() => preloadRoute(item.path)}
            className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
              location.pathname === item.path
                ? "text-white bg-tekhelet/20 border-l-4 border-tekhelet"
                : "text-lavender_web hover:text-white hover:bg-tekhelet/10"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};
