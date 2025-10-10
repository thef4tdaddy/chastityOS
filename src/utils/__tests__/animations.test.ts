/**
 * Tests for animation utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  prefersReducedMotion,
  getTransition,
  DURATIONS,
  EASINGS,
  taskCardVariants,
  buttonVariants,
  toastVariants,
  emptyStateVariants,
} from "../animations";

describe("Animation Utilities", () => {
  describe("prefersReducedMotion", () => {
    let matchMediaMock: any;

    beforeEach(() => {
      matchMediaMock = vi.fn();
      window.matchMedia = matchMediaMock;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should return true when user prefers reduced motion", () => {
      matchMediaMock.mockReturnValue({ matches: true });
      expect(prefersReducedMotion()).toBe(true);
    });

    it("should return false when user does not prefer reduced motion", () => {
      matchMediaMock.mockReturnValue({ matches: false });
      expect(prefersReducedMotion()).toBe(false);
    });

    it("should return false when window is undefined (SSR)", () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(prefersReducedMotion()).toBe(false);
      global.window = originalWindow;
    });
  });

  describe("getTransition", () => {
    it("should return duration 0 when user prefers reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: true,
      } as MediaQueryList);

      const transition = getTransition({ duration: 0.3 });
      expect(transition.duration).toBe(0);
    });

    it("should return original transition when user does not prefer reduced motion", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: false,
      } as MediaQueryList);

      const transition = getTransition({ duration: 0.3 });
      expect(transition.duration).toBe(0.3);
    });
  });

  describe("Animation Constants", () => {
    it("should have correct duration values", () => {
      expect(DURATIONS.fast).toBe(0.15);
      expect(DURATIONS.normal).toBe(0.3);
      expect(DURATIONS.slow).toBe(0.5);
    });

    it("should have correct easing values", () => {
      expect(EASINGS.easeInOut).toEqual([0.4, 0, 0.2, 1]);
      expect(EASINGS.easeOut).toEqual([0, 0, 0.2, 1]);
      expect(EASINGS.easeIn).toEqual([0.4, 0, 1, 1]);
      expect(EASINGS.spring).toEqual({
        type: "spring",
        stiffness: 300,
        damping: 25,
      });
    });
  });

  describe("Animation Variants", () => {
    it("should have taskCardVariants with required states", () => {
      expect(taskCardVariants).toHaveProperty("hidden");
      expect(taskCardVariants).toHaveProperty("visible");
      expect(taskCardVariants).toHaveProperty("exit");
      expect(taskCardVariants).toHaveProperty("hover");
    });

    it("should have buttonVariants with required states", () => {
      expect(buttonVariants).toHaveProperty("idle");
      expect(buttonVariants).toHaveProperty("hover");
      expect(buttonVariants).toHaveProperty("tap");
    });

    it("should have toastVariants with required states", () => {
      expect(toastVariants).toHaveProperty("hidden");
      expect(toastVariants).toHaveProperty("visible");
      expect(toastVariants).toHaveProperty("exit");
    });

    it("should have emptyStateVariants with required states", () => {
      expect(emptyStateVariants).toHaveProperty("hidden");
      expect(emptyStateVariants).toHaveProperty("visible");
    });

    it("taskCardVariants should have correct hidden state", () => {
      expect(taskCardVariants.hidden).toEqual({
        opacity: 0,
        y: 20,
        scale: 0.95,
      });
    });

    it("buttonVariants should scale on hover", () => {
      expect(buttonVariants.hover).toHaveProperty("scale");
      expect((buttonVariants.hover as any).scale).toBe(1.05);
    });

    it("buttonVariants should scale down on tap", () => {
      expect(buttonVariants.tap).toHaveProperty("scale");
      expect((buttonVariants.tap as any).scale).toBe(0.95);
    });
  });

  describe("Accessibility", () => {
    it("should respect reduced motion in all variants", () => {
      vi.spyOn(window, "matchMedia").mockReturnValue({
        matches: true,
      } as MediaQueryList);

      // Test that getTransition returns zero duration
      const transition = getTransition({ duration: 0.3 });
      expect(transition.duration).toBe(0);
    });
  });
});
