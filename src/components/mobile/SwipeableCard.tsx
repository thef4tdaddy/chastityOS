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

// Action color definitions
const actionColorClasses = {
  red: "bg-red-500 hover:bg-red-600 text-white",
  green: "bg-green-500 hover:bg-green-600 text-white",
  blue: "bg-blue-500 hover:bg-blue-600 text-white",
  yellow: "bg-yellow-500 hover:bg-yellow-600 text-black",
  purple: "bg-purple-500 hover:bg-purple-600 text-white",
};

// Action Button Component
const ActionButton: React.FC<{
  action: SwipeAction;
  index: number;
  side: "left" | "right";
  totalActions: number;
  onActionClick: (action: SwipeAction) => void;
}> = ({ action, index, side, totalActions, onActionClick }) => (
  <Button
    key={action.id}
    onClick={() => onActionClick(action)}
    className={`
      touch-target
      flex flex-col items-center justify-center
      w-16 h-full
      text-xs font-medium
      transition-all duration-200
      ${actionColorClasses[action.color]}
      ${index === 0 && side === "left" ? "rounded-l-lg" : ""}
      ${index === totalActions - 1 && side === "right" ? "rounded-r-lg" : ""}
    `}
    style={{
      transform: `translateX(${side === "left" ? -100 + index * 16 : 100 - index * 16}px)`,
    }}
  >
    {action.icon && <div className="mb-1">{action.icon}</div>}
    <span className="leading-tight">{action.label}</span>
  </Button>
);

// Actions Container Component
const ActionsContainer: React.FC<{
  actions: SwipeAction[];
  side: "left" | "right";
  onActionClick: (action: SwipeAction) => void;
}> = ({ actions, side, onActionClick }) => (
  <div
    className={`
    absolute inset-y-0 flex items-center
    ${side === "left" ? "left-0" : "right-0"}
  `}
  >
    {actions.map((action, index) => (
      <ActionButton
        key={action.id}
        action={action}
        index={index}
        side={side}
        totalActions={actions.length}
        onActionClick={onActionClick}
      />
    ))}
  </div>
);

// Overlay Component
const RevealOverlay: React.FC<{
  isRevealed: boolean;
  onClose: () => void;
}> = ({ isRevealed, onClose }) => {
  if (!isRevealed) return null;

  return (
    <div className="absolute inset-0 z-20 bg-transparent" onClick={onClose} />
  );
};

// Custom hook for swipe logic
const useSwipeLogic = (
  leftActions: SwipeAction[],
  rightActions: SwipeAction[],
  disabled: boolean,
) => {
  const [translateX, setTranslateX] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedSide, setRevealedSide] = useState<"left" | "right" | null>(
    null,
  );
  const { medium, success } = useHapticFeedback();

  const maxSwipeDistance = 120;

  const handleSwipeReveal = (side: "left" | "right") => {
    if (isRevealed && revealedSide === side) {
      closeActions();
    } else {
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

  return {
    translateX,
    isRevealed,
    closeActions,
    handleActionClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  className = "",
  leftActions = [],
  rightActions = [],
  onSwipeThreshold: _onSwipeThreshold = 0.3,
  disabled = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const _startX = useRef(0);

  const {
    translateX,
    isRevealed,
    closeActions,
    handleActionClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useSwipeLogic(leftActions, rightActions, disabled);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Actions */}
      {leftActions.length > 0 && (
        <ActionsContainer
          actions={leftActions}
          side="left"
          onActionClick={handleActionClick}
        />
      )}
      {rightActions.length > 0 && (
        <ActionsContainer
          actions={rightActions}
          side="right"
          onActionClick={handleActionClick}
        />
      )}

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
      <RevealOverlay isRevealed={isRevealed} onClose={closeActions} />
    </div>
  );
};

export default SwipeableCard;
