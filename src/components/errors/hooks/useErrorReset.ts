/**
 * useErrorReset
 * Custom hook for error reset/recovery logic
 */

import { useState, useCallback } from "react";

interface UseErrorResetOptions {
  onReset?: () => void;
  resetDelay?: number;
}

export const useErrorReset = (options: UseErrorResetOptions = {}) => {
  const { onReset, resetDelay = 0 } = options;
  const [isResetting, setIsResetting] = useState(false);

  const resetError = useCallback(() => {
    setIsResetting(true);

    if (resetDelay > 0) {
      setTimeout(() => {
        if (onReset) {
          onReset();
        }
        setIsResetting(false);
      }, resetDelay);
    } else {
      if (onReset) {
        onReset();
      }
      setIsResetting(false);
    }
  }, [onReset, resetDelay]);

  return { resetError, isResetting };
};
