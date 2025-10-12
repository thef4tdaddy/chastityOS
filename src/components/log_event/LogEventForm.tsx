import React, { useState } from "react";
import { useAuthState } from "../../contexts";
import { useCreateEvent } from "../../hooks/api/useEvents";
import { useNotificationActions } from "../../stores";
import type { EventType } from "../../types/database";
import {
  FaPlus,
  FaHeart,
  FaFire,
  FaGamepad,
  FaTint,
  FaSpinner,
} from "../../utils/iconImport";
import { Input, Textarea, Button, Switch } from "@/components/ui";

// Event type definitions with modern icons
const EVENT_TYPES = [
  {
    value: "orgasm" as EventType,
    label: "Orgasm",
    icon: FaHeart,
    color: "text-red-400",
    description: "Self or partner induced orgasm",
  },
  {
    value: "sexual_activity" as EventType,
    label: "Sexual Activity",
    icon: FaFire,
    color: "text-orange-400",
    description: "Sexual play or activity",
  },
  {
    value: "milestone" as EventType,
    label: "Milestone",
    icon: FaGamepad,
    color: "text-nightly-aquamarine",
    description: "Achievement or milestone reached",
  },
  {
    value: "note" as EventType,
    label: "Note",
    icon: FaTint,
    color: "text-nightly-lavender-floral",
    description: "General note or observation",
  },
];

// Event Type Selection Component
const EventTypeSelector: React.FC<{
  selectedType: EventType;
  onTypeChange: (type: EventType) => void;
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
                isSelected ? "text-nighty-honeydew" : "text-nightly-celadon"
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

// Basic Form Fields Component
const BasicFormFields: React.FC<{
  timestamp: string;
  notes: string;
  onTimestampChange: (timestamp: string) => void;
  onNotesChange: (notes: string) => void;
}> = ({ timestamp, notes, onTimestampChange, onNotesChange }) => (
  <>
    <div>
      <label
        htmlFor="event-timestamp"
        className="block text-sm font-medium text-nightly-celadon mb-2"
      >
        Date & Time
      </label>
      <Input
        id="event-timestamp"
        type="datetime-local"
        value={timestamp}
        onChange={(e) => onTimestampChange(e.target.value)}
        aria-label="Event date and time"
        required
        className="event-form-field w-full bg-white/5 border border-white/10 rounded p-2 sm:p-3 text-nighty-honeydew text-sm sm:text-base min-h-[44px]"
      />
    </div>
    <div>
      <label
        htmlFor="event-notes"
        className="block text-sm font-medium text-nightly-celadon mb-2"
      >
        Notes
      </label>
      <Textarea
        id="event-notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Describe the event..."
        aria-label="Event notes and description"
        className="event-form-field w-full bg-white/5 border border-white/10 rounded p-2 sm:p-3 text-nighty-honeydew placeholder-nightly-celadon/50 resize-none text-sm sm:text-base"
        rows={4}
      />
    </div>
  </>
);

// Advanced Form Fields Component
const AdvancedFormFields: React.FC<{
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

// Tags and Privacy Component
const TagsAndPrivacy: React.FC<{
  tags: string;
  isPrivate: boolean;
  onTagsChange: (tags: string) => void;
  onPrivacyChange: (isPrivate: boolean) => void;
}> = ({ tags, isPrivate, onTagsChange, onPrivacyChange }) => (
  <>
    <div>
      <label
        htmlFor="event-tags"
        className="block text-sm font-medium text-nightly-celadon mb-2"
      >
        Tags (comma separated)
      </label>
      <Input
        id="event-tags"
        type="text"
        value={tags}
        onChange={(e) => onTagsChange(e.target.value)}
        placeholder="romantic, intense, relaxed..."
        aria-label="Event tags, comma separated for categorization"
        className="event-form-field w-full bg-white/5 border border-white/10 rounded p-2 sm:p-3 text-nighty-honeydew placeholder-nightly-celadon/50 text-sm sm:text-base min-h-[44px]"
      />
    </div>
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-0">
      <div id="privacy-label">
        <div className="text-sm font-medium text-nightly-celadon">
          Private Event
        </div>
        <div className="text-xs text-nightly-celadon/70">
          Keep this event private
        </div>
      </div>
      <Switch
        checked={isPrivate}
        onCheckedChange={onPrivacyChange}
        aria-labelledby="privacy-label"
        aria-label={`Mark event as private. Currently ${isPrivate ? "private" : "public"}`}
      />
    </div>
  </>
);

// Submit Button Component
const SubmitButton: React.FC<{
  isPending: boolean;
}> = ({ isPending }) => (
  <Button
    type="submit"
    disabled={isPending}
    aria-label={isPending ? "Submitting event" : "Log new event"}
    aria-busy={isPending}
    className="event-button w-full bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-4 sm:px-6 py-3 sm:py-4 rounded font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
  >
    {isPending ? (
      <>
        <FaSpinner
          className="animate-spin text-base sm:text-lg"
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Logging Event...</span>
        <span className="sm:hidden">Logging...</span>
      </>
    ) : (
      <>
        <FaPlus
          className="transition-transform group-hover:scale-110 text-base sm:text-lg"
          aria-hidden="true"
        />
        Log Event
      </>
    )}
  </Button>
);

// Custom hook for form data management
const useEventFormData = () => {
  const [formData, setFormData] = useState({
    type: "note" as EventType,
    notes: "",
    timestamp: new Date().toISOString().slice(0, 16),
    mood: "",
    intensity: 5,
    tags: "",
    isPrivate: false,
  });

  const resetForm = () => {
    setFormData({
      type: "note" as EventType,
      notes: "",
      timestamp: new Date().toISOString().slice(0, 16),
      mood: "",
      intensity: 5,
      tags: "",
      isPrivate: false,
    });
  };

  return { formData, setFormData, resetForm };
};

// Helper function to create confetti particles for milestone events
const createConfetti = () => {
  const colors = ["#22c55e", "#10b981", "#84cc16", "#eab308", "#f59e0b"];
  const confettiCount = 30;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti-particle";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.top = "-10px";
    confetti.style.width = Math.random() * 10 + 5 + "px";
    confetti.style.height = Math.random() * 10 + 5 + "px";
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + "s";
    confetti.style.animationDuration = Math.random() * 2 + 2 + "s";

    document.body.appendChild(confetti);

    // Remove confetti after animation completes
    setTimeout(() => {
      confetti.remove();
    }, 3500);
  }
};

// Custom hook for form submission
const useEventSubmission = (
  formData: {
    type: EventType;
    notes: string;
    timestamp: string;
    mood: string;
    intensity: number;
    tags: string;
    isPrivate: boolean;
  },
  resetForm: () => void,
  onEventLogged?: () => void,
  targetUserId?: string,
) => {
  const { user } = useAuthState();
  const createEvent = useCreateEvent();
  const { showSuccess, showError } = useNotificationActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Use targetUserId if provided (for keyholders logging for submissives), otherwise use current user
    const userId = targetUserId || user.uid;

    try {
      await createEvent.mutateAsync({
        userId,
        type: formData.type,
        timestamp: new Date(formData.timestamp),
        notes: formData.notes,
        isPrivate: formData.isPrivate,
        metadata: {
          mood: formData.mood,
          intensity: formData.intensity,
          tags: formData.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag),
        },
      });

      // Show success with animation
      showSuccess("Event logged successfully", "Event Added");

      // Trigger confetti for milestone events
      if (formData.type === "milestone") {
        createConfetti();
      }

      onEventLogged?.();
      resetForm();
    } catch {
      showError("Failed to log event. Please try again.", "Event Log Failed");
    }
  };

  return { handleSubmit, isPending: createEvent.isPending };
};

// Event Form Component
interface LogEventFormProps {
  onEventLogged?: () => void;
  targetUserId?: string; // Allow logging for a specific user (for keyholders)
}

export const LogEventForm: React.FC<LogEventFormProps> = ({
  onEventLogged,
  targetUserId,
}) => {
  const { formData, setFormData, resetForm } = useEventFormData();
  const { handleSubmit, isPending } = useEventSubmission(
    formData,
    resetForm,
    onEventLogged,
    targetUserId,
  );

  return (
    <div
      className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6"
      role="region"
      aria-labelledby="log-event-heading"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <FaPlus
          className="text-nightly-aquamarine text-lg sm:text-xl"
          aria-hidden="true"
        />
        <h2
          id="log-event-heading"
          className="text-lg sm:text-xl font-semibold text-nighty-honeydew"
        >
          Log New Event
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 sm:space-y-4"
        aria-label="Log new event form"
      >
        <EventTypeSelector
          selectedType={formData.type}
          onTypeChange={(type) =>
            setFormData((prev) => ({ ...prev, type: type as EventType }))
          }
        />

        <BasicFormFields
          timestamp={formData.timestamp}
          notes={formData.notes}
          onTimestampChange={(timestamp) =>
            setFormData((prev) => ({ ...prev, timestamp }))
          }
          onNotesChange={(notes) => setFormData((prev) => ({ ...prev, notes }))}
        />

        <AdvancedFormFields
          mood={formData.mood}
          intensity={formData.intensity}
          onMoodChange={(mood) => setFormData((prev) => ({ ...prev, mood }))}
          onIntensityChange={(intensity) =>
            setFormData((prev) => ({ ...prev, intensity }))
          }
        />

        <TagsAndPrivacy
          tags={formData.tags}
          isPrivate={formData.isPrivate}
          onTagsChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
          onPrivacyChange={(isPrivate) =>
            setFormData((prev) => ({ ...prev, isPrivate }))
          }
        />

        <SubmitButton isPending={isPending} />
      </form>
    </div>
  );
};
