import React from "react";

export interface PauseState {
  canPause: boolean;
  cooldownRemaining?: number;
  lastPauseTime?: Date;
  nextPauseAvailable?: Date;
}

export interface DebugPanelProps {
  pauseState: PauseState | null;
  pauseStateLoading: boolean;
  pauseStateError: string | null;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  pauseState,
  pauseStateLoading,
  pauseStateError,
}) => {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="mt-8 p-4 bg-gray-800 rounded-lg text-xs">
      <h4 className="text-yellow-400 font-bold mb-2">Debug: Pause State</h4>
      <pre className="text-gray-300">
        {JSON.stringify(
          {
            canPause: pauseState?.canPause,
            cooldownRemaining: pauseState?.cooldownRemaining,
            lastPauseTime: pauseState?.lastPauseTime,
            nextPauseAvailable: pauseState?.nextPauseAvailable,
            isLoading: pauseStateLoading,
            error: pauseStateError,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
};
