/**
 * Goal Form Fields Component
 * Basic form fields for creating a personal goal
 */
import React from "react";
import { Input, Textarea } from "@/components/ui";

interface GoalFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  days: number;
  setDays: (value: number) => void;
  hours: number;
  setHours: (value: number) => void;
  description: string;
  setDescription: (value: string) => void;
  isCreating: boolean;
}

export const GoalFormFields: React.FC<GoalFormFieldsProps> = ({
  title,
  setTitle,
  days,
  setDays,
  hours,
  setHours,
  description,
  setDescription,
  isCreating,
}) => {
  return (
    <>
      <div>
        <label className="block text-sm text-nightly-celadon mb-2">
          Goal Title
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
          placeholder="e.g., 7 Day Challenge"
          disabled={isCreating}
        />
      </div>

      <div>
        <label className="block text-sm text-nightly-celadon mb-2">
          Target Duration
        </label>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
              placeholder="Days"
              disabled={isCreating}
            />
            <span className="text-xs text-nightly-celadon mt-1 block">
              Days
            </span>
          </div>
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value) || 0)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
              placeholder="Hours"
              disabled={isCreating}
            />
            <span className="text-xs text-nightly-celadon mt-1 block">
              Hours
            </span>
          </div>
        </div>
        <p className="text-xs text-nightly-celadon mt-2">
          Total: {days > 0 && `${days} days`} {hours > 0 && `${hours} hours`}
        </p>
      </div>

      <div>
        <label className="block text-sm text-nightly-celadon mb-2">
          Description (optional)
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine resize-none"
          rows={3}
          placeholder="What's your motivation for this goal?"
          disabled={isCreating}
        />
      </div>
    </>
  );
};
