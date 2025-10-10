/**
 * Personal Goal Card Component
 * Displays and manages personal chastity duration goals
 */
import React, { useState, memo, useMemo, useCallback } from "react";
import { FaTrash, FaEdit, FaCheck, FaTimes, FaTrophy } from "react-icons/fa";
import type { DBGoal } from "@/types/database";
import { Input, Textarea } from "@/components/ui";

interface PersonalGoalCardProps {
  goal: DBGoal;
  onUpdate: (
    goalId: string,
    title: string,
    targetDuration: number,
    description?: string,
  ) => void;
  onDelete: (goalId: string) => void;
}

// Helper to format duration from seconds to human readable
const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days} days`;
  }
  return `${hours} hours`;
};

// Helper to calculate progress percentage
const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

const PersonalGoalEditFormComponent: React.FC<{
  goal: DBGoal;
  onSave: (title: string, duration: number, description?: string) => void;
  onCancel: () => void;
}> = ({ goal, onSave, onCancel }) => {
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDays, setEditDays] = useState(
    Math.floor(goal.targetValue / 86400),
  );
  const [editHours, setEditHours] = useState(
    Math.floor((goal.targetValue % 86400) / 3600),
  );
  const [editDescription, setEditDescription] = useState(
    goal.description || "",
  );

  const handleSave = () => {
    const totalSeconds = editDays * 86400 + editHours * 3600;
    if (totalSeconds > 0) {
      onSave(editTitle, totalSeconds, editDescription);
    }
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
        Edit Personal Goal
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Goal Title
          </label>
          <Input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
            placeholder="My chastity goal"
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
                value={editDays}
                onChange={(e) => setEditDays(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
                placeholder="Days"
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
                value={editHours}
                onChange={(e) => setEditHours(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
                placeholder="Hours"
              />
              <span className="text-xs text-nightly-celadon mt-1 block">
                Hours
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Description (optional)
          </label>
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine resize-none"
            rows={3}
            placeholder="What's your motivation?"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-nightly-aquamarine/20 border border-nightly-aquamarine hover:bg-nightly-aquamarine/30 text-nightly-aquamarine font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FaCheck /> Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-white/5 border border-white/20 hover:bg-white/10 text-nightly-celadon font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FaTimes /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Memoize edit form
const PersonalGoalEditForm = memo(PersonalGoalEditFormComponent);

const PersonalGoalDisplayComponent: React.FC<{
  goal: DBGoal;
  isCompleted: boolean;
  progress: number;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ goal, isCompleted, progress, onEdit, onDelete }) => {
  // Memoize formatted durations
  const formattedCurrent = useMemo(
    () => formatDuration(goal.currentValue),
    [goal.currentValue],
  );
  const formattedTarget = useMemo(
    () => formatDuration(goal.targetValue),
    [goal.targetValue],
  );

  return (
    <div
      className={`glass-card p-6 ${isCompleted ? "border-2 border-nightly-aquamarine" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isCompleted && <FaTrophy className="text-yellow-400 text-xl" />}
            <h3 className="text-xl font-bold text-nightly-honeydew">
              {goal.title}
            </h3>
          </div>
          {goal.description && (
            <p className="text-sm text-nightly-celadon mt-2">
              {goal.description}
            </p>
          )}
        </div>

        {!isCompleted && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-nightly-aquamarine"
              title="Edit goal"
            >
              <FaEdit />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
              title="Delete goal"
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-nightly-celadon">Progress</span>
          <span className="text-nightly-honeydew font-semibold">
            {formattedCurrent} / {formattedTarget}
          </span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isCompleted
                ? "bg-gradient-to-r from-nightly-aquamarine to-nightly-lavender-floral"
                : "bg-gradient-to-r from-nightly-aquamarine/70 to-nightly-lavender-floral/70"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-nightly-celadon">
            {progress}% Complete
          </span>
          {isCompleted && (
            <span className="text-xs bg-nightly-aquamarine/20 text-nightly-aquamarine px-3 py-1 rounded-full font-semibold">
              ✓ Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize display component
const PersonalGoalDisplay = memo(PersonalGoalDisplayComponent);

const PersonalGoalCardComponent: React.FC<PersonalGoalCardProps> = ({
  goal,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Memoize progress calculation
  const progress = useMemo(
    () => calculateProgress(goal.currentValue, goal.targetValue),
    [goal.currentValue, goal.targetValue],
  );
  const isCompleted = goal.isCompleted;

  const handleSave = useCallback(
    (title: string, duration: number, description?: string) => {
      onUpdate(goal.id, title, duration, description);
      setIsEditing(false);
    },
    [goal.id, onUpdate],
  );

  const handleEdit = useCallback(() => setIsEditing(true), []);
  const handleCancel = useCallback(() => setIsEditing(false), []);
  const handleDelete = useCallback(
    () => onDelete(goal.id),
    [goal.id, onDelete],
  );

  if (isEditing) {
    return (
      <PersonalGoalEditForm
        goal={goal}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <PersonalGoalDisplay
      goal={goal}
      isCompleted={isCompleted}
      progress={progress}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

// Memoize main component
export const PersonalGoalCard = memo(PersonalGoalCardComponent);
