import React from "react";
import { SwipeableCard } from "../../components/mobile";

export const SwipeableCardDemo: React.FC = () => {
  const swipeActions = [
    {
      id: "delete",
      label: "Delete",
      color: "red" as const,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-fluid-lg font-semibold">Swipeable Cards</h2>
      <SwipeableCard
        rightActions={swipeActions}
        className="bg-white/10 rounded-lg"
      >
        <div className="p-4">
          <h3 className="font-semibold">Swipe left to reveal actions</h3>
          <p className="text-sm text-gray-300 mt-1">
            Try swiping this card to the left to see action buttons
          </p>
        </div>
      </SwipeableCard>
    </div>
  );
};
