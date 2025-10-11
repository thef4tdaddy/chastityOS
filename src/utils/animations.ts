/**
 * Animation utilities and variants for Framer Motion
 * All animations respect prefers-reduced-motion for accessibility
 */
import type { Variants } from "framer-motion";

/**
 * Animation durations based on the design system
 */
export const ANIMATION_DURATION = {
  fast: 0.15, // 150ms
  normal: 0.3, // 300ms
  slow: 0.5, // 500ms
} as const;

/**
 * Easing functions
 */
export const ANIMATION_EASING = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  spring: { type: "spring", stiffness: 300, damping: 30 },
} as const;

/**
 * Task card animations
 */
export const taskCardVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: ANIMATION_EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: ANIMATION_DURATION.fast },
  },
  hover: {
    y: -4,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: ANIMATION_EASING.easeOut,
    },
  },
};

/**
 * Button animations
 */
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: ANIMATION_DURATION.fast },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

/**
 * Fade in animation
 */
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: ANIMATION_DURATION.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: ANIMATION_DURATION.fast },
  },
};

/**
 * Slide in from top animation
 */
export const slideInFromTopVariants: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: ANIMATION_EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: ANIMATION_DURATION.fast },
  },
};

/**
 * Slide in from bottom animation
 */
export const slideInFromBottomVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: ANIMATION_EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: ANIMATION_DURATION.fast },
  },
};

/**
 * Stagger children animation
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Success animation with checkmark
 */
export const successVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.slow,
      times: [0, 0.6, 1],
      ease: ANIMATION_EASING.easeOut,
    },
  },
};

/**
 * Error shake animation
 */
export const errorShakeVariants: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: ANIMATION_DURATION.slow,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
    },
  },
};

/**
 * Pulse animation
 */
export const pulseVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: ANIMATION_DURATION.slow * 2,
      repeat: Infinity,
      ease: ANIMATION_EASING.easeInOut,
    },
  },
};

/**
 * Loading spinner animation
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
 * Tab switch animation
 */
export const tabContentVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: ANIMATION_EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: ANIMATION_DURATION.fast },
  },
};

/**
 * Scale in animation
 */
export const scaleInVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: ANIMATION_EASING.easeOut,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: { duration: ANIMATION_DURATION.fast },
  },
};

/**
 * File upload progress animation
 */
export const uploadProgressVariants: Variants = {
  initial: { scaleX: 0 },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: ANIMATION_EASING.easeOut,
    },
  }),
};

/**
 * Celebration/confetti animation for task completion
 */
export const celebrationVariants: Variants = {
  initial: { scale: 0, rotate: 0 },
  animate: {
    scale: [0, 1.5, 1],
    rotate: [0, 180, 360],
    transition: {
      duration: ANIMATION_DURATION.slow * 2,
      ease: ANIMATION_EASING.easeOut,
    },
  },
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get animation variants that respect prefers-reduced-motion
 * Returns instant transitions if reduced motion is preferred
 */
export const getAccessibleVariants = (variants: Variants): Variants => {
  if (prefersReducedMotion()) {
    // Create instant transitions
    const accessibleVariants: Variants = {};
    Object.keys(variants).forEach((key) => {
      accessibleVariants[key] = {
        ...variants[key],
        transition: { duration: 0 },
      };
    });
    return accessibleVariants;
  }
  return variants;
};
