import React from "react";

interface ShowcaseHeaderProps {
  isMobile: boolean;
  isLandscape: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const ShowcaseHeader: React.FC<ShowcaseHeaderProps> = ({
  isMobile,
  isLandscape,
  safeAreaInsets,
}) => {
  return (
    <div className="text-center">
      <h1 className="text-fluid-2xl font-bold mb-2">Mobile Showcase</h1>
      <p className="text-fluid-base text-lavender_web">
        Demonstrating mobile-first components and interactions
      </p>
      <div className="mt-4 text-fluid-sm text-rose_quartz">
        <p>Viewport: {isMobile ? "Mobile" : "Desktop"}</p>
        <p>Orientation: {isLandscape ? "Landscape" : "Portrait"}</p>
        {isMobile && (
          <p>
            Safe Areas: T:{safeAreaInsets.top} B:{safeAreaInsets.bottom}
          </p>
        )}
      </div>
    </div>
  );
};
