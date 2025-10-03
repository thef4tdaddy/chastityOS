// Navigation configuration data
import { ReactElement } from "react";

export interface NavItem {
  path: string;
  label: string;
}

export interface MobileNavItem {
  path: string;
  label: string;
  icon: ReactElement;
}

export const navItems: NavItem[] = [
  { path: "/", label: "Dashboard" },
  { path: "/chastity-tracking", label: "Tracker" },
  { path: "/log-event", label: "Log Event" },
  { path: "/full-report", label: "Full Report" },
  { path: "/tasks", label: "Tasks" },
  { path: "/rewards-punishments", label: "Rewards" },
  { path: "/settings", label: "Settings" },
  { path: "/achievements", label: "Achievements" },
];

// Mobile bottom nav items (most important features)
// Order: Tracker - Log Event - Full Report - Tasks - Rewards - Settings
export const mobileNavItemsConfig = [
  {
    path: "/chastity-tracking",
    label: "Tracker",
    iconPath:
      "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    path: "/log-event",
    label: "Log Event",
    iconPath: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  },
  {
    path: "/full-report",
    label: "Report",
    iconPath:
      "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    path: "/tasks",
    label: "Tasks",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    path: "/rewards-punishments",
    label: "Rewards",
    iconPath:
      "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
  },
  {
    path: "/settings",
    label: "Settings",
    iconPath:
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];
