/**
 * Simple Navigation Component
 * Basic navigation for testing the relationship system
 */
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaLock, FaUsers, FaClipboardList } from "../utils/iconImport";
import { BadgeIndicator } from "./ui/BadgeIndicator";
import { useTasks } from "../hooks/api/useTasks";
import { useAuthState } from "../contexts";
import { useBadgeCount } from "../hooks/useBadgeCount";

const Navigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthState();
  const { data: tasks } = useTasks(user?.uid || "");

  // Count pending tasks for badge
  const pendingTasksCount = useMemo(() => {
    if (!tasks) return 0;
    return tasks.filter(
      (task) => task.status === "pending" || task.status === "submitted",
    ).length;
  }, [tasks]);

  // Update app badge
  useBadgeCount({
    pendingTasksCount,
    enabled: true,
  });

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
                const showBadge =
                  item.path === "/tasks" && pendingTasksCount > 0;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors relative ${
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="mr-2" />
                    {item.label}
                    {showBadge && (
                      <BadgeIndicator
                        count={pendingTasksCount}
                        className="absolute -top-1 -right-1"
                      />
                    )}
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
