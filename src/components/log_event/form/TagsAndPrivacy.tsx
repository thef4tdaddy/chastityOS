import React from "react";
import { Input, Switch } from "@/components/ui";

// Tags and Privacy Component
export const TagsAndPrivacy: React.FC<{
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:p-0">
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
