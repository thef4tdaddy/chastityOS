import React from "react";
import { Button } from "@/components/ui";
import { EVENT_TYPES } from "./eventTypes";

// Event Type Selection Component
export const EventTypeSelector: React.FC<{
  selectedType: string;
  onTypeChange: (type: string) => void;
}> = ({ selectedType, onTypeChange }) => (
  <div>
    <label
      id="event-type-label"
      className="block text-sm font-medium text-nightly-celadon mb-3"
    >
      Event Type
    </label>
    <div
      role="group"
      aria-labelledby="event-type-label"
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3"
    >
      {EVENT_TYPES.map((eventType) => {
        const Icon = eventType.icon;
        const isSelected = selectedType === eventType.value;
        return (
          <Button
            key={eventType.value}
            type="button"
            onClick={() => onTypeChange(eventType.value)}
            aria-label={`${eventType.label}: ${eventType.description}`}
            aria-pressed={isSelected}
            className={`event-button p-3 sm:p-4 rounded-lg border-2 transition-all min-h-[44px] ${
              isSelected
                ? "border-nightly-aquamarine bg-nightly-aquamarine/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <Icon
              aria-hidden="true"
              className={`text-base sm:text-lg mb-1 sm:mb-2 mx-auto transition-transform ${
                isSelected
                  ? "text-nightly-aquamarine scale-110"
                  : eventType.color
              }`}
            />
            <div
              className={`text-xs sm:text-sm font-medium ${
                isSelected ? "text-nightly-honeydew" : "text-nightly-celadon"
              }`}
            >
              {eventType.label}
            </div>
          </Button>
        );
      })}
    </div>
  </div>
);
