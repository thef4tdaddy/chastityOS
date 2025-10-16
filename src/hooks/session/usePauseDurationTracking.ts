/**
 * Pause Duration Tracking Hook
 * Tracks current pause duration with live updates
 */
import { useEffect } from "react";
import type { PauseStatus } from "../../types/pauseResume";

export function usePauseDurationTracking(
  pauseStatus: PauseStatus,
  updatePauseDuration: (duration: number) => void,
) {
  useEffect(() => {
    if (!pauseStatus.isPaused || !pauseStatus.pauseStartTime) {
      return;
    }

    const interval = setInterval(() => {
      const duration = Math.floor(
        (Date.now() - pauseStatus.pauseStartTime!.getTime()) / 1000,
      );
      updatePauseDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
    // updatePauseDuration should be stable (useCallback) in parent component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseStatus.isPaused, pauseStatus.pauseStartTime]);
}
