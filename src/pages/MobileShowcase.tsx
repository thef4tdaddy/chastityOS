/**
 * Mobile Showcase Page
 * Demonstrates mobile-first components and interactions
 */
import React, { useState } from "react";
import { BottomSheet } from "../components/mobile";
import { useViewport, useHapticFeedback } from "../hooks/mobile";
import { ShowcaseHeader } from "./showcase/ShowcaseHeader";
import { HapticFeedbackDemo } from "./showcase/HapticFeedbackDemo";
import { ButtonVariantsDemo } from "./showcase/ButtonVariantsDemo";
import { InputExamplesDemo } from "./showcase/InputExamplesDemo";
import { TouchTargetsDemo } from "./showcase/TouchTargetsDemo";
import { SwipeableCardDemo } from "./showcase/SwipeableCardDemo";
import { PullToRefreshDemo } from "./showcase/PullToRefreshDemo";

const MobileShowcase: React.FC = () => {
  const { isMobile, isLandscape, safeAreaInsets } = useViewport();
  const { light, medium, heavy, success } = useHapticFeedback();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-dark_purple text-white safe-area-inset-all">
      <div className="container-mobile py-6 space-y-8">
        <ShowcaseHeader
          isMobile={isMobile}
          isLandscape={isLandscape}
          safeAreaInsets={safeAreaInsets}
        />

        <HapticFeedbackDemo
          onLight={light}
          onMedium={medium}
          onHeavy={heavy}
          onSuccess={success}
        />

        <ButtonVariantsDemo />
        <InputExamplesDemo />

        <TouchTargetsDemo onShowBottomSheet={() => setShowBottomSheet(true)} />
        <SwipeableCardDemo />

        <PullToRefreshDemo
          refreshCount={refreshCount}
          onRefresh={handleRefresh}
        />
      </div>

      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title="Bottom Sheet Example"
      >
        <div className="p-4 space-y-4">
          <p>
            This is a bottom sheet that slides up from the bottom of the screen.
          </p>
          <p>Perfect for mobile actions, forms, or additional content.</p>
        </div>
      </BottomSheet>
    </div>
  );
};

export default MobileShowcase;
