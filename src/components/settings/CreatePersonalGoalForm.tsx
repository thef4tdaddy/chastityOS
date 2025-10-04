/**
 * Create Personal Goal Form Component
 * Form for creating a new personal chastity duration goal
 */
import React, { useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";

interface CreatePersonalGoalFormProps {
  onCreate: (
    title: string,
    targetDuration: number,
    description?: string,
  ) => void;
  isCreating: boolean;
}

export const CreatePersonalGoalForm: React.FC<CreatePersonalGoalFormProps> = ({
  onCreate,
  isCreating,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState(7);
  const [hours, setHours] = useState(0);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;

    const totalSeconds = days * 86400 + hours * 3600;
    if (totalSeconds <= 0) return;

    onCreate(title.trim(), totalSeconds, description.trim() || undefined);

    // Reset form
    setTitle("");
    setDays(7);
    setHours(0);
    setDescription("");
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTitle("");
    setDays(7);
    setHours(0);
    setDescription("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full glass-card p-6 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-nightly-aquamarine font-semibold"
      >
        <FaPlus /> Create Personal Goal
      </button>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Create Personal Goal
        </h3>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-nightly-celadon"
        >
          <FaTimes />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Goal Title
          </label>
          <input
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
              <input
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
              <input
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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine resize-none"
            rows={3}
            placeholder="What's your motivation for this goal?"
            disabled={isCreating}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isCreating || !title.trim() || (days === 0 && hours === 0)}
          className="w-full bg-nightly-aquamarine/20 border border-nightly-aquamarine hover:bg-nightly-aquamarine/30 text-nightly-aquamarine font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCreating ? (
            "Creating..."
          ) : (
            <>
              <FaPlus /> Create Goal
            </>
          )}
        </button>
      </div>
    </div>
  );
};
