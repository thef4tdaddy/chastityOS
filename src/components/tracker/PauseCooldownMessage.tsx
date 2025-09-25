import React from "react";

interface PauseCooldownMessageProps {
  message: string;
}

export const PauseCooldownMessage: React.FC<PauseCooldownMessageProps> = ({
  message,
}) => {
  return (
    <div className="mb-4 p-3 bg-yellow-600/30 border border-yellow-500 rounded-lg text-sm text-yellow-200">
      {message}
    </div>
  );
};
