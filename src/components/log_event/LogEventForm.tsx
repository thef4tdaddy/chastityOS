import React from "react";
import { FaPlus } from "@/utils/iconImport";
import { EventErrorDisplay } from "./EventErrorDisplay";
import { EventTypeSelector } from "./form/EventTypeSelector";
import { BasicFormFields } from "./form/BasicFormFields";
import { AdvancedFormFields } from "./form/AdvancedFormFields";
import { TagsAndPrivacy } from "./form/TagsAndPrivacy";
import { SubmitButton } from "./form/SubmitButton";
import { useEventFormData } from "./form/useEventFormData";
import { useEventSubmission } from "./form/useEventSubmission";

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
  const { handleSubmit, isPending, formError, handleRetry, dismissError } =
    useEventSubmission(formData, resetForm, onEventLogged, targetUserId);

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

      {/* Error Display */}
      <EventErrorDisplay
        error={formError}
        onDismiss={dismissError}
        onRetry={handleRetry}
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-3 sm:space-y-4"
        aria-label="Log new event form"
      >
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
