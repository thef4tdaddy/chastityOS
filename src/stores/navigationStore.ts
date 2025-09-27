/**
 * Navigation Store - Pure UI State
 * Manages navigation state, breadcrumbs, and mobile menu
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface NavigationState {
  // Current page/route
  currentPage: string;

  // Breadcrumbs for navigation
  breadcrumbs: string[];

  // Mobile menu state
  isMobileMenuOpen: boolean;

  // Page loading state
  isPageLoading: boolean;

  // Page title state
  pageTitle?: string;

  // Actions
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  closeMobileMenu: () => void;
  setPageLoading: (isLoading: boolean) => void;
  setPageTitle: (title: string) => void;

  // Utility actions
  addBreadcrumb: (breadcrumb: string) => void;
  removeBreadcrumb: () => void;
  clearBreadcrumbs: () => void;

  // Reset for testing
  resetStore: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, _get) => ({
      // Initial state
      currentPage: "dashboard",
      breadcrumbs: [],
      isMobileMenuOpen: false,
      isPageLoading: false,
      pageTitle: undefined,

      // Actions
      setCurrentPage: (page: string) =>
        set({ currentPage: page }, false, "setCurrentPage"),

      setBreadcrumbs: (breadcrumbs: string[]) =>
        set({ breadcrumbs }, false, "setBreadcrumbs"),

      toggleMobileMenu: () =>
        set(
          (state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }),
          false,
          "toggleMobileMenu",
        ),

      setMobileMenuOpen: (isOpen: boolean) =>
        set({ isMobileMenuOpen: isOpen }, false, "setMobileMenuOpen"),

      closeMobileMenu: () =>
        set({ isMobileMenuOpen: false }, false, "closeMobileMenu"),

      setPageLoading: (isLoading: boolean) =>
        set({ isPageLoading: isLoading }, false, "setPageLoading"),

      setPageTitle: (title: string) =>
        set({ pageTitle: title }, false, "setPageTitle"),

      // Utility actions
      addBreadcrumb: (breadcrumb: string) =>
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
