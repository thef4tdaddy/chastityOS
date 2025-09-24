/**
 * Navigation Store
 * UI state management for navigation, mobile menu, and breadcrumbs
 * Zustand store - handles navigation UI state only
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("NavigationStore");

export interface BreadcrumbItem {
  label: string;
  path?: string | undefined;
  isActive?: boolean | undefined;
}

export interface NavigationState {
  // Mobile menu state
  isMobileMenuOpen: boolean;

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[];

  // Page metadata
  currentPageTitle: string;
  currentPageDescription?: string | undefined;

  // Loading states for navigation
  isNavigating: boolean;
}

export interface NavigationActions {
  // Mobile menu actions
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openMobileMenu: () => void;

  // Breadcrumb management
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  clearBreadcrumbs: () => void;

  // Page metadata
  setPageTitle: (title: string) => void;
  setPageDescription: (description: string) => void;
  setPageMetadata: (title: string, description?: string) => void;

  // Navigation loading
  setNavigating: (isNavigating: boolean) => void;

  // Reset
  resetStore: () => void;
}

export interface NavigationStore extends NavigationState, NavigationActions {}

const initialState: NavigationState = {
  isMobileMenuOpen: false,
  breadcrumbs: [],
  currentPageTitle: "ChastityOS",
  currentPageDescription: undefined,
  isNavigating: false,
};

export const useNavigationStore = create<NavigationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Mobile menu actions
      toggleMobileMenu: () => {
        const { isMobileMenuOpen } = get();
        set({ isMobileMenuOpen: !isMobileMenuOpen });
        logger.debug("Mobile menu toggled", { isOpen: !isMobileMenuOpen });
      },

      closeMobileMenu: () => {
        set({ isMobileMenuOpen: false });
        logger.debug("Mobile menu closed");
      },

      openMobileMenu: () => {
        set({ isMobileMenuOpen: true });
        logger.debug("Mobile menu opened");
      },

      // Breadcrumb management
      setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => {
        set({ breadcrumbs });
        logger.debug("Breadcrumbs set", { count: breadcrumbs.length });
      },

      addBreadcrumb: (breadcrumb: BreadcrumbItem) => {
        const { breadcrumbs } = get();
        const newBreadcrumbs = [...breadcrumbs, breadcrumb];
        set({ breadcrumbs: newBreadcrumbs });
        logger.debug("Breadcrumb added", {
          breadcrumb,
          total: newBreadcrumbs.length,
        });
      },

      clearBreadcrumbs: () => {
        set({ breadcrumbs: [] });
        logger.debug("Breadcrumbs cleared");
      },

      // Page metadata
      setPageTitle: (title: string) => {
        set({ currentPageTitle: title });

        // Update document title
        if (typeof document !== "undefined") {
          document.title = title;
        }

        logger.debug("Page title set", { title });
      },

      setPageDescription: (description: string) => {
        set({ currentPageDescription: description });
        logger.debug("Page description set", { description });
      },

      setPageMetadata: (title: string, description?: string) => {
        set({
          currentPageTitle: title,
          currentPageDescription: description,
        });

        // Update document title
        if (typeof document !== "undefined") {
          document.title = title;
        }

        logger.debug("Page metadata set", { title, description });
      },

      // Navigation loading
      setNavigating: (isNavigating: boolean) => {
        set({ isNavigating });
        logger.debug("Navigation state changed", { isNavigating });
      },

      // Reset
      resetStore: () => {
        set(initialState);
        logger.debug("Navigation store reset to initial state");
      },
    }),
    {
      name: "navigation-store",
      // Only enable devtools in development
      enabled:
        import.meta.env.MODE === "development" ||
        import.meta.env.MODE === "nightly",
    },
  ),
);
