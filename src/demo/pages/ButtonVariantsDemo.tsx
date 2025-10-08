import React from "react";
import { MobileCard, MobileButton } from "../../components/mobile";

export const ButtonVariantsDemo: React.FC = () => {
  return (
    <MobileCard variant="elevated" className="space-y-4">
      <h2 className="text-fluid-lg font-semibold">Button Variants</h2>
      <div className="space-y-3">
        <MobileButton fullWidth>Primary Button</MobileButton>
        <MobileButton variant="secondary" fullWidth>
          Secondary Button
        </MobileButton>
        <MobileButton variant="outline" fullWidth>
          Outline Button
        </MobileButton>
        <MobileButton variant="ghost" fullWidth>
          Ghost Button
        </MobileButton>
        <MobileButton variant="danger" fullWidth>
          Danger Button
        </MobileButton>
        <MobileButton loading fullWidth>
          Loading Button
        </MobileButton>
      </div>
    </MobileCard>
  );
};
