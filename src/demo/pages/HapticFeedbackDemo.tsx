import React from "react";
import { MobileCard, MobileButton } from "../../components/mobile";

interface HapticFeedbackDemoProps {
  onLight: () => void;
  onMedium: () => void;
  onHeavy: () => void;
  onSuccess: () => void;
}

export const HapticFeedbackDemo: React.FC<HapticFeedbackDemoProps> = ({
  onLight,
  onMedium,
  onHeavy,
  onSuccess,
}) => {
  return (
    <MobileCard variant="glass" className="space-y-4">
      <h2 className="text-fluid-lg font-semibold">Haptic Feedback</h2>
      <div className="grid grid-cols-2 gap-3">
        <MobileButton size="sm" onClick={onLight}>
          Light
        </MobileButton>
        <MobileButton size="sm" onClick={onMedium} variant="secondary">
          Medium
        </MobileButton>
        <MobileButton size="sm" onClick={onHeavy} variant="outline">
          Heavy
        </MobileButton>
        <MobileButton size="sm" onClick={onSuccess} variant="primary">
          Success
        </MobileButton>
      </div>
    </MobileCard>
  );
};
