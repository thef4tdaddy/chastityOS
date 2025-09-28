/**
 * Swipeable Card Component
 * Card that responds to swipe gestures for actions
 */
import React, { useState, useRef } from "react";
import { useTouchGestures } from "../../hooks/mobile/useTouchGestures";
import { useHapticFeedback } from "../../hooks/mobile/useHapticFeedback";

interface SwipeAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color: "red" | "green" | "blue" | "yellow" | "purple";
  action: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  className?: string;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeThreshold?: number;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  className = "",
  leftActions = [],
  rightActions = [],
  onSwipeThreshold: _onSwipeThreshold = 0.3,
  disabled = false,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedSide, setRevealedSide] = useState<"left" | "right" | null>(
    null,
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const _startX = useRef(0);
  const { medium, success } = useHapticFeedback();

  const maxSwipeDistance = 120; // Maximum pixels to swipe

  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures(
    {
      onSwipeLeft: () => {
        if (disabled || rightActions.length === 0) return;
        handleSwipeReveal("right");
      },
      onSwipeRight: () => {
        if (disabled || leftActions.length === 0) return;
        handleSwipeReveal("left");
      },
    },
    {
      threshold: 20,
      minDistance: 50,
    },
  );

  const handleSwipeReveal = (side: "left" | "right") => {
    if (isRevealed && revealedSide === side) {
      // Close if already revealed on the same side
      closeActions();
    } else {
      // Reveal actions
      medium();
      setIsRevealed(true);
      setRevealedSide(side);
      setTranslateX(side === "left" ? maxSwipeDistance : -maxSwipeDistance);
    }
  };

  const closeActions = () => {
    setIsRevealed(false);
    setRevealedSide(null);
    setTranslateX(0);
  };

  const handleActionClick = (action: SwipeAction) => {
    success();
    action.action();
    closeActions();
  };

  const actionColorClasses = {
    red: "bg-red-500 hover:bg-red-600 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-black",
    purple: "bg-purple-500 hover:bg-purple-600 text-white",
  };

  const renderActions = (actions: SwipeAction[], side: "left" | "right") => (
    <div
      className={`
      absolute inset-y-0 flex items-center
      ${side === "left" ? "left-0" : "right-0"}
    `}
    >
      {actions.map((action, index) => (
        <button
          key={action.id}
          onClick={() => handleActionClick(action)}
          className={`
            touch-target
            flex flex-col items-center justify-center
            w-16 h-full
            text-xs font-medium
            transition-all duration-200
            ${actionColorClasses[action.color]}
            ${index === 0 && side === "left" ? "rounded-l-lg" : ""}
            ${index === actions.length - 1 && side === "right" ? "rounded-r-lg" : ""}
          `}
          style={{
            transform: `translateX(${side === "left" ? -100 + index * 16 : 100 - index * 16}px)`,
          }}
        >
          {action.icon && <div className="mb-1">{action.icon}</div>}
          <span className="leading-tight">{action.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Actions */}
      {leftActions.length > 0 && renderActions(leftActions, "left")}
      {rightActions.length > 0 && renderActions(rightActions, "right")}

      {/* Main Card Content */}
      <div
        ref={cardRef}
        className={`
          relative z-10
          bg-white dark:bg-gray-800
          transition-transform duration-300 ease-out
          ${!disabled ? "touch-target" : ""}
        `}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={isRevealed ? closeActions : undefined}
      >
        {children}
      </div>

      {/* Overlay when actions are revealed */}
      {isRevealed && (
        <div
          className="absolute inset-0 z-20 bg-transparent"
          onClick={closeActions}
        />
      )}
    </div>
  );
};

export default SwipeableCard;
