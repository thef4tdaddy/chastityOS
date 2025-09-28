/**
 * Viewport Hook
 * Provides viewport dimensions and mobile-specific viewport utilities
 */
import { useState, useEffect, useCallback } from "react";

interface ViewportSize {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
}

interface ViewportInfo extends ViewportSize {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// Breakpoints
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export const useViewport = (): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportSize>(() => {
    if (typeof window === "undefined") {
      return {
        width: 0,
        height: 0,
        innerWidth: 0,
        innerHeight: 0,
      };
    }

    return {
      width: window.screen.width,
      height: window.screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });

  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  const updateViewport = useCallback(() => {
    setViewport({
      width: window.screen.width,
      height: window.screen.height,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    });
  }, []);

  const updateSafeAreaInsets = useCallback(() => {
    if (typeof window === "undefined" || !window.getComputedStyle) return;

    const computedStyle = window.getComputedStyle(document.documentElement);

    setSafeAreaInsets({
      top: parseInt(
        computedStyle.getPropertyValue("env(safe-area-inset-top)") || "0",
      ),
      bottom: parseInt(
        computedStyle.getPropertyValue("env(safe-area-inset-bottom)") || "0",
      ),
      left: parseInt(
        computedStyle.getPropertyValue("env(safe-area-inset-left)") || "0",
      ),
      right: parseInt(
        computedStyle.getPropertyValue("env(safe-area-inset-right)") || "0",
      ),
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    updateViewport();
    updateSafeAreaInsets();

    // Handle resize events with throttling
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateViewport();
        updateSafeAreaInsets();
      }, 150);
    };

    // Handle orientation change
    const handleOrientationChange = () => {
      // Delay to account for viewport changes after orientation change
      setTimeout(() => {
        updateViewport();
        updateSafeAreaInsets();
      }, 500);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, {
      passive: true,
    });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [updateViewport, updateSafeAreaInsets]);

  // Determine device type based on viewport width
  const isMobile = viewport.innerWidth < MOBILE_BREAKPOINT;
  const isTablet =
    viewport.innerWidth >= MOBILE_BREAKPOINT &&
    viewport.innerWidth < TABLET_BREAKPOINT;
  const isDesktop = viewport.innerWidth >= TABLET_BREAKPOINT;

  // Determine orientation
  const isLandscape = viewport.innerWidth > viewport.innerHeight;
  const isPortrait = viewport.innerHeight >= viewport.innerWidth;

  return {
    ...viewport,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait,
    safeAreaInsets,
  };
};

export default useViewport;
