/**
 * NavigationStore Tests
 * Unit tests for NavigationStore functionality
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useNavigationStore } from "../navigationStore";

describe("NavigationStore", () => {
  beforeEach(() => {
    // Reset store before each test by setting to initial state
    const store = useNavigationStore.getState();
    store.setCurrentPage("dashboard");
    store.setBreadcrumbs([]);
    store.setMobileMenuOpen(false);
    store.setPageLoading(false);
    store.setPageTitle("");
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
      const { setMobileMenuOpen } = useNavigationStore.getState();

      setMobileMenuOpen(true);
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);
    });

    it("should close mobile menu", () => {
      const { setMobileMenuOpen, closeMobileMenu } =
        useNavigationStore.getState();

      setMobileMenuOpen(true);
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(true);

      closeMobileMenu();
      expect(useNavigationStore.getState().isMobileMenuOpen).toBe(false);
    });
  });

  describe("Page Title Management", () => {
    it("should start with undefined page title", () => {
      const { pageTitle } = useNavigationStore.getState();
      expect(pageTitle).toBe("");
    });

    it("should update page title", () => {
      const { setPageTitle } = useNavigationStore.getState();

      setPageTitle("Test Page");
      expect(useNavigationStore.getState().pageTitle).toBe("Test Page");
    });

    it("should set current page", () => {
      const { setCurrentPage } = useNavigationStore.getState();

      setCurrentPage("settings");
      const state = useNavigationStore.getState();

      expect(state.currentPage).toBe("settings");
    });
  });

  describe("Breadcrumbs", () => {
    it("should start with empty breadcrumbs", () => {
      const { breadcrumbs } = useNavigationStore.getState();
      expect(breadcrumbs).toEqual([]);
    });

    it("should set breadcrumbs", () => {
      const { setBreadcrumbs } = useNavigationStore.getState();
      const testBreadcrumbs = ["Home", "Settings"];

      setBreadcrumbs(testBreadcrumbs);
      expect(useNavigationStore.getState().breadcrumbs).toEqual(
        testBreadcrumbs,
      );
    });

    it("should add breadcrumb", () => {
      const { addBreadcrumb } = useNavigationStore.getState();
      const breadcrumb = "Home";

      addBreadcrumb(breadcrumb);
      expect(useNavigationStore.getState().breadcrumbs).toEqual([breadcrumb]);
    });

    it("should clear breadcrumbs", () => {
      const { setBreadcrumbs, clearBreadcrumbs } =
        useNavigationStore.getState();

      setBreadcrumbs(["Home"]);
      expect(useNavigationStore.getState().breadcrumbs).toHaveLength(1);

      clearBreadcrumbs();
      expect(useNavigationStore.getState().breadcrumbs).toEqual([]);
    });
  });

  describe("Page Loading", () => {
    it("should start with page not loading", () => {
      const { isPageLoading } = useNavigationStore.getState();
      expect(isPageLoading).toBe(false);
    });

    it("should set page loading state", () => {
      const { setPageLoading } = useNavigationStore.getState();

      setPageLoading(true);
      expect(useNavigationStore.getState().isPageLoading).toBe(true);

      setPageLoading(false);
      expect(useNavigationStore.getState().isPageLoading).toBe(false);
    });
  });

  describe("Current Page Management", () => {
    it("should start with default current page", () => {
      const { currentPage } = useNavigationStore.getState();
      expect(currentPage).toBe("dashboard");
    });

    it("should update current page", () => {
      const { setCurrentPage } = useNavigationStore.getState();

      setCurrentPage("profile");
      expect(useNavigationStore.getState().currentPage).toBe("profile");
    });
  });
});
