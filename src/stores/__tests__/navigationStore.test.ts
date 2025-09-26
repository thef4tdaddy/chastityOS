/**
 * NavigationStore Tests
 * Unit tests for NavigationStore functionality
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useNavigationStore } from "../navigationStore";

describe("NavigationStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useNavigationStore.getState().resetStore();
  });

  describe("Mobile Menu", () => {
    it("should start with mobile menu closed", () => {
      const { isMobileMenuOpen } = useNavigationStore.getState();
      expect(isMobileMenuOpen).toBe(false);
    });

    it("should toggle mobile menu state", () => {
      const { toggleMobileMenu } = useNavigationStore.getState();

      toggleMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);

      toggleMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);
    });

    it("should open mobile menu", () => {
      const { openMobileMenu } = useNavigationStore.getState();

      openMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);
    });

    it("should close mobile menu", () => {
      const { openMobileMenu, closeMobileMenu } = useNavigationStore.getState();

      openMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);

      closeMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);
    });
  });

  describe("Page Title Management", () => {
    it("should start with default page title", () => {
      const { currentPageTitle } = useNavigationStore.getState();
      expect(currentPageTitle).toBe("ChastityOS");
    });

    it("should update page title", () => {
      const { setPageTitle } = useNavigationStore.getState();

      setPageTitle("Test Page");
      expect(useNavigationStore.getState().currentPageTitle).toBe("Test Page");
    });

    it("should set page metadata", () => {
      const { setPageMetadata } = useNavigationStore.getState();

      setPageMetadata("Test Page", "Test Description");
      const state = useNavigationStore.getState();

      expect(state.currentPageTitle).toBe("Test Page");
      expect(state.currentPageDescription).toBe("Test Description");
    });
  });

  describe("Breadcrumbs", () => {
    it("should start with empty breadcrumbs", () => {
      const { breadcrumbs } = useNavigationStore.getState();
      expect(breadcrumbs).toEqual([]);
    });

    it("should set breadcrumbs", () => {
      const { setBreadcrumbs } = useNavigationStore.getState();
      const testBreadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Settings", path: "/settings" },
      ];

      setBreadcrumbs(testBreadcrumbs);
      expect(useNavigationStore.getState().breadcrumbs).toEqual(
        testBreadcrumbs,
      );
    });

    it("should add breadcrumb", () => {
      const { addBreadcrumb } = useNavigationStore.getState();
      const breadcrumb = { label: "Home", path: "/" };

      addBreadcrumb(breadcrumb);
      expect(useNavigationStore.getState().breadcrumbs).toEqual([breadcrumb]);
    });

    it("should clear breadcrumbs", () => {
      const { setBreadcrumbs, clearBreadcrumbs } =
        useNavigationStore.getState();

      setBreadcrumbs([{ label: "Home", path: "/" }]);
      expect(useNavigationStore.getState().breadcrumbs).toHaveLength(1);

      clearBreadcrumbs();
      expect(useNavigationStore.getState().breadcrumbs).toEqual([]);
    });
  });

  describe("Navigation Loading", () => {
    it("should start with navigation not loading", () => {
      const { isNavigating } = useNavigationStore.getState();
      expect(isNavigating).toBe(false);
    });

    it("should set navigation loading state", () => {
      const { setNavigating } = useNavigationStore.getState();

      setNavigating(true);
      expect(useNavigationStore.getState().isNavigating).toBe(true);

      setNavigating(false);
      expect(useNavigationStore.getState().isNavigating).toBe(false);
    });
  });

  describe("Store Reset", () => {
    it("should reset store to initial state", () => {
      const {
        openMobileMenu,
        setPageTitle,
        setBreadcrumbs,
        setNavigating,
        resetStore,
      } = useNavigationStore.getState();

      // Change state
      openMobileMenu();
      setPageTitle("Test Page");
      setBreadcrumbs([{ label: "Test" }]);
      setNavigating(true);

      // Verify state changed
      let state = useNavigationStore.getState();
      expect(state.isMobileMenuOpen).toBe(true);
      expect(state.currentPageTitle).toBe("Test Page");
      expect(state.breadcrumbs).toHaveLength(1);
      expect(state.isNavigating).toBe(true);

      // Reset and verify
      resetStore();
      state = useNavigationStore.getState();
      expect(state.isMobileMenuOpen).toBe(false);
      expect(state.currentPageTitle).toBe("ChastityOS");
      expect(state.breadcrumbs).toEqual([]);
      expect(state.isNavigating).toBe(false);
    });
  });
});
