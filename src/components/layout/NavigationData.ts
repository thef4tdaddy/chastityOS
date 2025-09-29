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
  { path: "/chastity-tracking", label: "Chastity Tracking" },
  { path: "/tasks", label: "Tasks" },
  { path: "/rewards-punishments", label: "Rewards/Punishments" },
  { path: "/full-report", label: "Full Report" },
  { path: "/settings", label: "Settings" },
  { path: "/achievements", label: "Achievements" },
  { path: "/log-event", label: "Log Event" },
];

// Mobile bottom nav items (most important features)
// These icons will be created in the component that uses them
export const mobileNavItemsConfig = [
  {
    path: "/",
    label: "Home",
    iconPath:
      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    path: "/chastity-tracking",
    label: "Tracking",
    iconPath:
      "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    path: "/tasks",
    label: "Tasks",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    path: "/log-event",
    label: "Log",
    iconPath: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  },
  {
    path: "/achievements",
    label: "Rewards",
    iconPath:
      "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
];
