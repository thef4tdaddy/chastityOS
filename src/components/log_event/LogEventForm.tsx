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
} from "react-icons/fa";

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

// Event Form Component
interface LogEventFormProps {
  onEventLogged?: () => void; // Simplified callback since TanStack Query handles data updates
}

export const LogEventForm: React.FC<LogEventFormProps> = ({
  onEventLogged,
}) => {
  const { user } = useAuthState();
  const { createEvent } = useEventMutations();
  const { showSuccess, showError } = useNotificationActions();
  
  const [formData, setFormData] = useState({
    type: "note" as EventType,
    notes: "",
    timestamp: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    mood: "",
    intensity: 5,
    tags: "",
    isPrivate: false,
  });

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
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        },
      });

      // Show success notification
      showSuccess("Event logged successfully", "Event Added");
      
      // Call optional callback
      onEventLogged?.();

      // Reset form
      setFormData({
        type: "note" as EventType,
        notes: "",
        timestamp: new Date().toISOString().slice(0, 16),
        mood: "",
        intensity: 5,
        tags: "",
        isPrivate: false,
      });
    } catch (error) {
      showError("Failed to log event. Please try again.", "Event Log Failed");
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaPlus className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nighty-honeydew">
          Log New Event
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Type Selection */}
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
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: eventType.value }))
                  }
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.type === eventType.value
                      ? "border-nightly-aquamarine bg-nightly-aquamarine/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Icon
                    className={`text-lg mb-2 mx-auto ${
                      formData.type === eventType.value
                        ? "text-nightly-aquamarine"
                        : eventType.color
                    }`}
                  />
                  <div
                    className={`text-sm font-medium ${
                      formData.type === eventType.value
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

        {/* Timestamp */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={formData.timestamp}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, timestamp: e.target.value }))
            }
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Describe the event..."
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Mood
            </label>
            <input
              type="text"
              value={formData.mood}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, mood: e.target.value }))
              }
              placeholder="Happy, frustrated, excited..."
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50"
            />
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Intensity (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.intensity}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  intensity: parseInt(e.target.value),
                }))
              }
              className="w-full mb-2"
            />
            <div className="text-center text-nighty-honeydew">
              {formData.intensity}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, tags: e.target.value }))
            }
            placeholder="romantic, intense, relaxed..."
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nighty-honeydew placeholder-nightly-celadon/50"
          />
        </div>

        {/* Privacy */}
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
              checked={formData.isPrivate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isPrivate: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-6 py-3 rounded font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
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
      </form>
    </div>
  );
};
