import React from "react";
import { Input } from "@/components/ui";

// Advanced Form Fields Component
export const AdvancedFormFields: React.FC<{
  mood: string;
  intensity: number;
  onMoodChange: (mood: string) => void;
  onIntensityChange: (intensity: number) => void;
}> = ({ mood, intensity, onMoodChange, onIntensityChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
    <div>
      <label
        htmlFor="event-mood"
        className="block text-sm font-medium text-nightly-celadon mb-2"
      >
        Mood
      </label>
      <Input
        id="event-mood"
        type="text"
        value={mood}
        onChange={(e) => onMoodChange(e.target.value)}
        placeholder="Happy, frustrated, excited..."
        aria-label="Event mood or emotional state"
        className="event-form-field w-full bg-white/5 border border-white/10 rounded p-2 sm:p-3 text-nighty-honeydew placeholder-nightly-celadon/50 text-sm sm:text-base min-h-[44px]"
      />
    </div>
    <div>
      <label
        htmlFor="event-intensity"
        id="intensity-label"
        className="block text-sm font-medium text-nightly-celadon mb-2"
      >
        Intensity (1-10)
      </label>
      <input
        id="event-intensity"
        type="range"
        min="1"
        max="10"
        value={intensity}
        onChange={(e) => onIntensityChange(parseInt(e.target.value))}
        aria-label="Event intensity level from 1 to 10"
        aria-labelledby="intensity-label"
        aria-valuenow={intensity}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuetext={`${intensity} out of 10`}
        className="w-full mb-2 transition-all h-[44px]"
        style={{ WebkitAppearance: "none", appearance: "none" }}
      />
      <div
        className="text-center text-nighty-honeydew transition-all text-base sm:text-lg font-medium"
        aria-live="polite"
        aria-atomic="true"
      >
        {intensity}
      </div>
    </div>
  </div>
);
