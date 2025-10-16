import React from "react";
import { useCountdownTimer } from "../../hooks/tasks/useCountdownTimer";

// Helper component for countdown timer
interface CountdownTimerProps {
  deadline: Date;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ deadline }) => {
  const { isExpired, formattedTime } = useCountdownTimer(deadline);

  return (
    <span
      className={`font-mono ${isExpired ? "text-red-400" : "text-nightly-aquamarine"}`}
    >
      {formattedTime}
    </span>
  );
};
