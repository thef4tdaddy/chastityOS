import React from "react";
import { Input, Textarea } from "@/components/ui";

// Basic Form Fields Component
export const BasicFormFields: React.FC<{
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
