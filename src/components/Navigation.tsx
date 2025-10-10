/**
 * Simple Navigation Component
 * Basic navigation for testing the relationship system
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaLock, FaUsers, FaClipboardList } from "../utils/iconImport";

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: FaHome },
    { path: "/chastity-tracking", label: "Chastity", icon: FaLock },
    { path: "/relationships", label: "Relationships", icon: FaUsers },
    { path: "/log-event", label: "Log Events", icon: FaClipboardList },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              <div className="flex items-center">
                <span className="text-xl font-bold text-gray-900">
                  ChastityOS
                </span>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
