import React, { useState, useEffect } from "react";
import { FaClock } from "../../utils/iconImport";
// TODO: Replace with proper hook pattern instead of direct service import
// import { PauseCooldownService } from "../../services/PauseCooldownService";

interface CooldownTimerProps {
  cooldownSeconds: number;
  className?: string;
}

export const CooldownTimer: React.FC<CooldownTimerProps> = ({
  cooldownSeconds: initialCooldownSeconds,
  className = "",
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialCooldownSeconds);

  useEffect(() => {
    setTimeRemaining(initialCooldownSeconds);
  }, [initialCooldownSeconds]);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  if (timeRemaining === 0) return null;

  return (
    <div
      className={`bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-4 ${className}`}
    >
      <div className="flex items-center gap-2">
        <FaClock className="text-yellow-600" />
        <div>
          <div className="font-medium text-yellow-800">
            Pause Cooldown Active
          </div>
          <div className="text-sm text-yellow-700">
            Next pause available in: {Math.floor(timeRemaining / 60)}m{" "}
            {timeRemaining % 60}s
          </div>
        </div>
      </div>
    </div>
  );
};
