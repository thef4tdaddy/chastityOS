/**
 * Navigation Store - Pure UI State
 * Manages navigation state, breadcrumbs, and mobile menu
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Type definitions that are referenced in other files
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface NavigationActions {
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  closeMobileMenu: () => void;
  setPageLoading: (isLoading: boolean) => void;
  setPageTitle: (title: string) => void;
  addBreadcrumb: (breadcrumb: string) => void;
  removeBreadcrumb: () => void;
  clearBreadcrumbs: () => void;
  resetStore: () => void;
}

export interface NavigationState extends NavigationActions {
  // Current page/route
  currentPage: string;
  currentPageTitle: string;
  currentPageDescription?: string;

  // Breadcrumbs for navigation
  breadcrumbs: Array<{ label: string; path?: string }>;

  // Mobile menu state
  isMobileMenuOpen: boolean;

  // Navigation loading state
  isNavigating: boolean;

<<<<<<< HEAD
  // Actions
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (
    breadcrumbs: Array<{ label: string; path?: string }>,
  ) => void;
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  setNavigating: (isNavigating: boolean) => void;
  setPageTitle: (title: string) => void;
  setPageMetadata: (title: string, description?: string) => void;

  // Utility actions
  addBreadcrumb: (breadcrumb: { label: string; path?: string }) => void;
  removeBreadcrumb: () => void;
  clearBreadcrumbs: () => void;

  // Reset function for testing
  resetStore: () => void;
=======
  // Page title state
  pageTitle?: string;
>>>>>>> origin/nightly
}

const initialState = {
  currentPage: "dashboard",
  currentPageTitle: "ChastityOS",
  currentPageDescription: undefined,
  breadcrumbs: [],
  isMobileMenuOpen: false,
  isNavigating: false,
};

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, _get) => ({
      // Initial state
<<<<<<< HEAD
      ...initialState,
=======
      currentPage: "dashboard",
      breadcrumbs: [],
      isMobileMenuOpen: false,
      isPageLoading: false,
      pageTitle: undefined,
>>>>>>> origin/nightly

      // Actions
      setCurrentPage: (page: string) =>
        set({ currentPage: page }, false, "setCurrentPage"),

      setBreadcrumbs: (breadcrumbs: Array<{ label: string; path?: string }>) =>
        set({ breadcrumbs }, false, "setBreadcrumbs"),

      toggleMobileMenu: () =>
        set(
          (state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }),
          false,
          "toggleMobileMenu",
        ),

      openMobileMenu: () =>
        set({ isMobileMenuOpen: true }, false, "openMobileMenu"),

      closeMobileMenu: () =>
        set({ isMobileMenuOpen: false }, false, "closeMobileMenu"),

<<<<<<< HEAD
      setNavigating: (isNavigating: boolean) =>
        set({ isNavigating }, false, "setNavigating"),

      setPageTitle: (title: string) =>
        set({ currentPageTitle: title }, false, "setPageTitle"),

      setPageMetadata: (title: string, description?: string) =>
        set(
          { currentPageTitle: title, currentPageDescription: description },
          false,
          "setPageMetadata",
        ),
=======
      setPageLoading: (isLoading: boolean) =>
        set({ isPageLoading: isLoading }, false, "setPageLoading"),
>>>>>>> origin/nightly

      setPageTitle: (title: string) =>
        set({ pageTitle: title }, false, "setPageTitle"),

      // Utility actions
      addBreadcrumb: (breadcrumb: { label: string; path?: string }) =>
        set(
          (state) => ({
            breadcrumbs: [...state.breadcrumbs, breadcrumb],
          }),
          false,
          "addBreadcrumb",
        ),

      removeBreadcrumb: () =>
        set(
          (state) => ({
            breadcrumbs: state.breadcrumbs.slice(0, -1),
          }),
          false,
          "removeBreadcrumb",
        ),

      clearBreadcrumbs: () =>
        set({ breadcrumbs: [] }, false, "clearBreadcrumbs"),

<<<<<<< HEAD
      // Reset function for testing
      resetStore: () => set(initialState, false, "resetStore"),
=======
      // Reset store to initial state (for testing)
      resetStore: () =>
        set(
          {
            currentPage: "dashboard",
            breadcrumbs: [],
            isMobileMenuOpen: false,
            isPageLoading: false,
            pageTitle: undefined,
          },
          false,
          "resetStore",
        ),
>>>>>>> origin/nightly
    }),
    {
      name: "navigation-store",
    },
  ),
);

// Selector hooks for better performance
export const useCurrentPage = () =>
  useNavigationStore((state) => state.currentPage);

export const useBreadcrumbs = () =>
  useNavigationStore((state) => state.breadcrumbs);

export const useIsMobileMenuOpen = () =>
  useNavigationStore((state) => state.isMobileMenuOpen);

export const useIsPageLoading = () =>
  useNavigationStore((state) => state.isPageLoading);

// Type aliases for export compatibility
export type NavigationStore = NavigationState;
