import { useState, useEffect } from "react";

// Custom hook for countdown timer logic
export const useCountdownTimer = (deadline: Date) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadlineTime = deadline.getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
        return;
      }

      setIsExpired(false);
      setTimeRemaining(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  // Format time for display
  const formatTime = (milliseconds: number): string => {
    if (milliseconds <= 0) return "Overdue";

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  };

  return {
    timeRemaining,
    isExpired,
    formattedTime: formatTime(timeRemaining),
  };
};
