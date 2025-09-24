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
  
  // Actions
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setPageLoading: (isLoading: boolean) => void;
  
  // Utility actions
  addBreadcrumb: (breadcrumb: string) => void;
  removeBreadcrumb: () => void;
  clearBreadcrumbs: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentPage: "dashboard",
      breadcrumbs: [],
      isMobileMenuOpen: false,
      isPageLoading: false,

      // Actions
      setCurrentPage: (page: string) => 
        set({ currentPage: page }, false, "setCurrentPage"),

      setBreadcrumbs: (breadcrumbs: string[]) =>
        set({ breadcrumbs }, false, "setBreadcrumbs"),

      toggleMobileMenu: () =>
        set(
          (state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }),
          false,
          "toggleMobileMenu"
        ),

      setMobileMenuOpen: (isOpen: boolean) =>
        set({ isMobileMenuOpen: isOpen }, false, "setMobileMenuOpen"),

      setPageLoading: (isLoading: boolean) =>
        set({ isPageLoading: isLoading }, false, "setPageLoading"),

      // Utility actions
      addBreadcrumb: (breadcrumb: string) =>
        set(
          (state) => ({
            breadcrumbs: [...state.breadcrumbs, breadcrumb],
          }),
          false,
          "addBreadcrumb"
        ),

      removeBreadcrumb: () =>
        set(
          (state) => ({
            breadcrumbs: state.breadcrumbs.slice(0, -1),
          }),
          false,
          "removeBreadcrumb"
        ),

      clearBreadcrumbs: () =>
        set({ breadcrumbs: [] }, false, "clearBreadcrumbs"),
    }),
    {
      name: "navigation-store",
    }
  )
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