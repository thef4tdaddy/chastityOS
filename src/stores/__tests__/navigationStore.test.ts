/**
 * NavigationStore Tests
 * Unit tests for NavigationStore functionality using modern v4.0 architecture
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useNavigationStore } from "../navigationStore";

describe("NavigationStore", () => {
  beforeEach(() => {
    // Reset store before each test using the modern reset method
    useNavigationStore.getState().resetStore();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = useNavigationStore.getState();

      expect(state.currentPage).toBe("dashboard");
      expect(state.breadcrumbs).toEqual([]);
      expect(state.isMobileMenuOpen).toBe(false);
      expect(state.isPageLoading).toBe(false);
      expect(state.pageTitle).toBeUndefined();
    });
  });

  describe("Page Management", () => {
    it("should set current page", () => {
      const { setCurrentPage } = useNavigationStore.getState();

      setCurrentPage("settings");

      expect(useNavigationStore.getState().currentPage).toBe("settings");
    });

    it("should set page title", () => {
      const { setPageTitle } = useNavigationStore.getState();

      setPageTitle("User Settings");

      expect(useNavigationStore.getState().pageTitle).toBe("User Settings");
    });

    it("should set page loading state", () => {
      const { setPageLoading } = useNavigationStore.getState();

      setPageLoading(true);
      expect(useNavigationStore.getState().isPageLoading).toBe(true);

      setPageLoading(false);
      expect(useNavigationStore.getState().isPageLoading).toBe(false);
    });
  });

  describe("Mobile Menu Management", () => {
    it("should start with mobile menu closed", () => {
      const { isMobileMenuOpen } = useNavigationStore.getState();
      expect(isMobileMenuOpen).toBe(false);
    });

    it("should toggle mobile menu state", () => {
      const { toggleMobileMenu } = useNavigationStore.getState();

      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);

      toggleMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);

      toggleMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);
    });

    it("should open mobile menu explicitly", () => {
      const { openMobileMenu } = useNavigationStore.getState();

      openMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);
    });

    it("should close mobile menu explicitly", () => {
      const { openMobileMenu, closeMobileMenu } = useNavigationStore.getState();

      // First open it
      openMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);

      // Then close it
      closeMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);
    });
  });

  describe("Breadcrumb Management", () => {
    it("should start with empty breadcrumbs", () => {
      const { breadcrumbs } = useNavigationStore.getState();
      expect(breadcrumbs).toEqual([]);
    });

    it("should set breadcrumbs", () => {
      const { setBreadcrumbs } = useNavigationStore.getState();
      const testBreadcrumbs = ["Home", "Settings", "Profile"];

      setBreadcrumbs(testBreadcrumbs);

      expect(useNavigationStore.getState().breadcrumbs).toEqual(
        testBreadcrumbs,
      );
    });

    it("should add breadcrumb", () => {
      const { addBreadcrumb } = useNavigationStore.getState();

      addBreadcrumb("Home");
      expect(useNavigationStore.getState().breadcrumbs).toEqual(["Home"]);

      addBreadcrumb("Settings");
      expect(useNavigationStore.getState().breadcrumbs).toEqual([
        "Home",
        "Settings",
      ]);
    });

    it("should remove last breadcrumb", () => {
      const { setBreadcrumbs, removeBreadcrumb } =
        useNavigationStore.getState();

      setBreadcrumbs(["Home", "Settings", "Profile"]);
      expect(useNavigationStore.getState().breadcrumbs).toEqual([
        "Home",
        "Settings",
        "Profile",
      ]);

      removeBreadcrumb();
      expect(useNavigationStore.getState().breadcrumbs).toEqual([
        "Home",
        "Settings",
      ]);

      removeBreadcrumb();
      expect(useNavigationStore.getState().breadcrumbs).toEqual(["Home"]);
    });

    it("should clear all breadcrumbs", () => {
      const { setBreadcrumbs, clearBreadcrumbs } =
        useNavigationStore.getState();

      setBreadcrumbs(["Home", "Settings", "Profile"]);
      expect(useNavigationStore.getState().breadcrumbs).toEqual([
        "Home",
        "Settings",
        "Profile",
      ]);

      clearBreadcrumbs();
      expect(useNavigationStore.getState().breadcrumbs).toEqual([]);
    });
  });

  describe("Store Reset", () => {
    it("should reset store to initial state", () => {
      const {
        setCurrentPage,
        setPageTitle,
        openMobileMenu,
        setBreadcrumbs,
        setPageLoading,
        resetStore,
      } = useNavigationStore.getState();

      // Change all values
      setCurrentPage("custom-page");
      setPageTitle("Custom Title");
      openMobileMenu();
      setBreadcrumbs(["Custom", "Path"]);
      setPageLoading(true);

      // Verify changes
      let state = useNavigationStore.getState();
      expect(state.currentPage).toBe("custom-page");
      expect(state.pageTitle).toBe("Custom Title");
      expect(state.isMobileMenuOpen).toBe(true);
      expect(state.breadcrumbs).toEqual(["Custom", "Path"]);
      expect(state.isPageLoading).toBe(true);

      // Reset and verify
      resetStore();
      state = useNavigationStore.getState();
      expect(state.currentPage).toBe("dashboard");
      expect(state.pageTitle).toBeUndefined();
      expect(state.isMobileMenuOpen).toBe(false);
      expect(state.breadcrumbs).toEqual([]);
      expect(state.isPageLoading).toBe(false);
    });
  });
});
