
import React from 'react';

interface GoalDisplayProps {
  remainingGoalTime: number;
}

export const GoalDisplay: React.FC<GoalDisplayProps> = ({ remainingGoalTime }) => {
  return (
    <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20`}>
      <p className={`text-lg font-semibold text-blue-200`}>
        Time Remaining on Goal:
      </p>
      <p className="text-3xl font-bold text-blue-100">
        {remainingGoalTime}
      </p>
    </div>
  );
};
