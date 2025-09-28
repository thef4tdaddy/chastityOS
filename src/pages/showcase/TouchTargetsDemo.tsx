import React from "react";
import { MobileCard, TouchTarget } from "../../components/mobile";

interface TouchTargetsDemoProps {
  onShowBottomSheet: () => void;
}

export const TouchTargetsDemo: React.FC<TouchTargetsDemoProps> = ({
  onShowBottomSheet,
}) => {
  return (
    <MobileCard variant="outlined" className="space-y-4">
      <h2 className="text-fluid-lg font-semibold">Touch Targets</h2>
      <div className="grid grid-cols-3 gap-4">
        <TouchTarget
          onTap={() => alert("Tapped!")}
          className="bg-tekhelet/20 rounded-lg flex-col"
        >
          <span className="text-2xl">👆</span>
          <span className="text-xs">Tap</span>
        </TouchTarget>
        <TouchTarget
          onLongPress={() => alert("Long pressed!")}
          className="bg-tangerine/20 rounded-lg flex-col"
          hapticFeedback="medium"
        >
          <span className="text-2xl">👇</span>
          <span className="text-xs">Hold</span>
        </TouchTarget>
        <TouchTarget
          onTap={onShowBottomSheet}
          className="bg-green-500/20 rounded-lg flex-col"
        >
          <span className="text-2xl">📋</span>
          <span className="text-xs">Sheet</span>
        </TouchTarget>
      </div>
    </MobileCard>
  );
};
