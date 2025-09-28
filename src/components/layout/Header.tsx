import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SyncStatusIndicator } from "@/components/common";

interface HeaderProps {
  navItems: Array<{ path: string; label: string }>;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  navItems,
  isMobileMenuOpen,
  toggleMobileMenu,
}) => {
  const location = useLocation();

  return (
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
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-lavender_web hover:text-white hover:bg-tekhelet/20 focus:outline-none focus:ring-2 focus:ring-tekhelet"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
