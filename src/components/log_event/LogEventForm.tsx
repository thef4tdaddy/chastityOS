import React, { useState } from "react";
import { useAuthState } from "../../contexts";
import { useEventMutations } from "../../hooks/api";
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
    <label className="block text-sm font-medium text-nightly-celadon mb-3">
      Event Type
    </label>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {EVENT_TYPES.map((eventType) => {
        const Icon = eventType.icon;
        return (
          <button
            key={eventType.value}
            type="button"
            onClick={() => onTypeChange(eventType.value)}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedType === eventType.value
                ? "border-nightly-aquamarine bg-nightly-aquamarine/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <Icon
              className={`text-lg mb-2 mx-auto ${
                selectedType === eventType.value
                  ? "text-nightly-aquamarine"
                  : eventType.color
              }`}
            />
            <div
              className={`text-sm font-medium ${
                selectedType === eventType.value
                  ? "text-nighty-honeydew"
                  : "text-nightly-celadon"
              }`}
            >
              {eventType.label}
            </div>
          </button>
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
      <label className="block text-sm font-medium text-nightly-celadon mb-2">
        Date & Time
      </label>
      <input
        type="datetime-local"
        value={timestamp}
        onChange={(e) => onTimestampChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-nightly-celadon mb-2">
        Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Describe the event..."
        className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50 resize-none"
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
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-nightly-celadon mb-2">
        Mood
      </label>
      <input
        type="text"
        value={mood}
        onChange={(e) => onMoodChange(e.target.value)}
        placeholder="Happy, frustrated, excited..."
        className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-nightly-celadon mb-2">
        Intensity (1-10)
      </label>
      <input
        type="range"
        min="1"
        max="10"
        value={intensity}
        onChange={(e) => onIntensityChange(parseInt(e.target.value))}
        className="w-full mb-2"
      />
      <div className="text-center text-nighty-honeydew">{intensity}</div>
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
      <label className="block text-sm font-medium text-nightly-celadon mb-2">
        Tags (comma separated)
      </label>
      <input
        type="text"
        value={tags}
        onChange={(e) => onTagsChange(e.target.value)}
        placeholder="romantic, intense, relaxed..."
        className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50"
      />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-nightly-celadon">
          Private Event
        </div>
        <div className="text-xs text-nightly-celadon/70">
          Keep this event private
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
      </label>
    </div>
  </>
);

// Submit Button Component
const SubmitButton: React.FC<{
  isPending: boolean;
}> = ({ isPending }) => (
  <button
    type="submit"
    disabled={isPending}
    className="w-full bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-6 py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
  >
    {isPending ? (
      <>
        <FaSpinner className="animate-spin" />
        Logging Event...
      </>
    ) : (
      <>
        <FaPlus />
        Log Event
      </>
    )}
  </button>
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
) => {
  const { user } = useAuthState();
  const { createEvent } = useEventMutations();
  const { showSuccess, showError } = useNotificationActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createEvent.mutateAsync({
        userId: user.uid,
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

      showSuccess("Event logged successfully", "Event Added");
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
}

export const LogEventForm: React.FC<LogEventFormProps> = ({
  onEventLogged,
}) => {
  const { formData, setFormData, resetForm } = useEventFormData();
  const { handleSubmit, isPending } = useEventSubmission(
    formData,
    resetForm,
    onEventLogged,
  );

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaPlus className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nighty-honeydew">
          Log New Event
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <EventTypeSelector
          selectedType={formData.type}
          onTypeChange={(type) => setFormData((prev) => ({ ...prev, type }))}
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
