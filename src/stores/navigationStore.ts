/**
 * Navigation Store
 * Manages navigation state including mobile menu, page titles, and breadcrumbs
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface NavigationActions {
  setCurrentPage: (page: string) => void;
  setPageTitle: (title: string) => void;
  setPageMetadata: (title: string, description?: string) => void;
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  addBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
  removeBreadcrumb: () => void;
  clearBreadcrumbs: () => void;
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  setPageLoading: (isLoading: boolean) => void;
  setNavigating: (isNavigating: boolean) => void;
  resetStore: () => void;
}

export interface NavigationState extends NavigationActions {
  // Current page state
  currentPage: string;

  // Page title and metadata
  pageTitle: string;
  pageDescription?: string;

  // Breadcrumbs navigation
  breadcrumbs: BreadcrumbItem[];

  // Mobile menu state
  isMobileMenuOpen: boolean;

  // Loading states
  isPageLoading: boolean;
  isNavigating: boolean;
}

export type NavigationStore = NavigationState;

const initialState = {
  currentPage: "",
  pageTitle: "ChastityOS",
  pageDescription: undefined,
  breadcrumbs: [],
  isMobileMenuOpen: false,
  isPageLoading: false,
  isNavigating: false,
};

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Page actions
      setCurrentPage: (page: string) =>
        set({ currentPage: page }, false, "setCurrentPage"),

      setPageTitle: (title: string) =>
        set({ pageTitle: title }, false, "setPageTitle"),

      setPageMetadata: (title: string, description?: string) =>
        set(
          { pageTitle: title, pageDescription: description },
          false,
          "setPageMetadata",
        ),

      // Breadcrumb actions
      setBreadcrumbs: (breadcrumbs) =>
        set({ breadcrumbs }, false, "setBreadcrumbs"),

      addBreadcrumb: (breadcrumb) =>
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

      // Mobile menu actions
      toggleMobileMenu: () =>
        set(
          (state) => ({
            isMobileMenuOpen: !state.isMobileMenuOpen,
          }),
          false,
          "toggleMobileMenu",
        ),

      openMobileMenu: () =>
        set({ isMobileMenuOpen: true }, false, "openMobileMenu"),

      closeMobileMenu: () =>
        set({ isMobileMenuOpen: false }, false, "closeMobileMenu"),

      // Loading state actions
      setPageLoading: (isLoading: boolean) =>
        set({ isPageLoading: isLoading }, false, "setPageLoading"),

      setNavigating: (isNavigating: boolean) =>
        set({ isNavigating }, false, "setNavigating"),

      // Reset
      resetStore: () => set(initialState, false, "resetStore"),
    }),
    { name: "navigation-store" },
  ),
);

// Convenience hooks for common selectors
export const useCurrentPage = () =>
  useNavigationStore((state) => state.currentPage);

export const useBreadcrumbs = () =>
  useNavigationStore((state) => state.breadcrumbs);

export const useIsMobileMenuOpen = () =>
  useNavigationStore((state) => state.isMobileMenuOpen);

export const useIsPageLoading = () =>
  useNavigationStore((state) => state.isPageLoading);

export const usePageTitle = () =>
  useNavigationStore((state) => state.pageTitle);
