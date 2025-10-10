/**
 * Animation utilities for Task UI
 * Provides Framer Motion variants and animation helpers
 * Respects prefers-reduced-motion for accessibility
 */

import type { Variants, Transition } from "framer-motion";

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Standard animation durations (in seconds)
 */
export const DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const;

/**
 * Standard easing functions
 */
export const EASINGS = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  spring: { type: "spring" as const, stiffness: 300, damping: 25 },
} as const;

/**
 * Get transition with reduced motion support
 */
export const getTransition = (
  transition: Transition = { duration: DURATIONS.normal },
): Transition => {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return transition;
};

/**
 * Task Card Animations
 */
export const taskCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: getTransition({
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
    }),
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: getTransition({
      duration: DURATIONS.fast,
      ease: EASINGS.easeIn,
    }),
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    transition: getTransition({
      duration: DURATIONS.fast,
      ease: EASINGS.easeOut,
    }),
  },
};

/**
 * Button Animations
 */
export const buttonVariants: Variants = {
  idle: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: getTransition({
      duration: DURATIONS.fast,
      ease: EASINGS.easeOut,
    }),
  },
  tap: {
    scale: 0.95,
    transition: getTransition({
      duration: DURATIONS.fast / 2,
    }),
  },
};

/**
 * Loading Spinner Animation
 */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

/**
 * Success Checkmark Animation
 */
export const checkmarkVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: getTransition({
      duration: DURATIONS.slow,
      ease: EASINGS.easeOut,
    }),
  },
};

/**
 * Status Badge Animations
 */
export const statusBadgeVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: getTransition({
      ...EASINGS.spring,
      delay: 0.1,
    }),
  },
};

/**
 * Upload Zone Animations
 */
export const uploadZoneVariants: Variants = {
  idle: {
    scale: 1,
    borderColor: "rgba(156, 163, 175, 0.3)",
  },
  hover: {
    scale: 1.01,
    borderColor: "rgba(96, 165, 250, 0.6)",
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    transition: getTransition({
      duration: DURATIONS.fast,
    }),
  },
  dragOver: {
    scale: 1.02,
    borderColor: "rgba(96, 165, 250, 1)",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    transition: getTransition({
      duration: DURATIONS.fast,
    }),
  },
};

/**
 * Image Preview Fade-in
 */
export const imagePreviewVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: getTransition({
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
    }),
  },
};

/**
 * Toast/Notification Animations
 */
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.3,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: getTransition({
      ...EASINGS.spring,
    }),
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: getTransition({
      duration: DURATIONS.fast,
      ease: EASINGS.easeIn,
    }),
  },
};

/**
 * Progress Bar Animation
 */
export const progressBarVariants: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  animate: (duration: number) => ({
    scaleX: 1,
    transition: {
      duration: duration,
      ease: "linear",
    },
  }),
};

/**
 * Empty State Animations
 */
export const emptyStateVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: getTransition({
      duration: DURATIONS.slow,
      ease: EASINGS.easeOut,
    }),
  },
};

/**
 * Pulsing CTA Animation
 */
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: EASINGS.easeInOut,
    },
  },
};

/**
 * Success Celebration Animation (for points awarded)
 */
export const celebrationVariants: Variants = {
  hidden: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  visible: {
    scale: [0, 1.2, 1],
    rotate: [0, 10, -10, 0],
    opacity: 1,
    transition: getTransition({
      duration: DURATIONS.slow,
      ease: EASINGS.spring,
    }),
  },
};

/**
 * Stagger Children Animation
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * List Item Animation (for stagger)
 */
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: getTransition({
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
    }),
  },
};

/**
 * Modal/Overlay Backdrop
 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: getTransition({
      duration: DURATIONS.fast,
    }),
  },
};

/**
 * Rejection Shake Animation
 */
export const shakeVariants: Variants = {
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: getTransition({
      duration: DURATIONS.slow,
    }),
  },
};
