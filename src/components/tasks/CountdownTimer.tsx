import React, { useState, useEffect } from 'react';

// Helper component for countdown timer
interface CountdownTimerProps {
  deadline: Date;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadlineTime = deadline.getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft('Overdue');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`font-mono ${isOverdue ? 'text-red-400' : 'text-nightly-aquamarine'}`}>
      {timeLeft}
    </span>
  );
};