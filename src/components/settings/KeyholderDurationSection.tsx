/**
 * Keyholder Required Duration Section
 * Allows keyholder to set minimum required chastity duration
 */
import React, { useState } from "react";
import {
  useKeyholderRequiredDurationQuery,
  usePersonalGoalMutations,
} from "@/hooks/api/usePersonalGoalQueries";
import { FaLock, FaEdit, FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import type { DBGoal } from "@/types/database";
import { useToast } from "@/contexts";
import { Card } from "@/components/ui";

interface KeyholderDurationSectionProps {
  userId?: string | null;
}

// Helper to format duration from seconds
const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days} days`;
  }
  return `${hours} hours`;
};

const KeyholderDurationEditForm: React.FC<{
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
    <Card variant="glass" padding="lg" className="border-2 border-nightly-lavender-floral">
      <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
        Edit Required Duration
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Requirement Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-lavender-floral"
            placeholder="Minimum lock duration"
          />
        </div>

        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Required Duration
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                value={editDays}
                onChange={(e) => setEditDays(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-lavender-floral"
                placeholder="Days"
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
                value={editHours}
                onChange={(e) => setEditHours(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-lavender-floral"
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
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-lavender-floral resize-none"
            rows={2}
            placeholder="Why this duration is required..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-nightly-lavender-floral/20 border border-nightly-lavender-floral hover:bg-nightly-lavender-floral/30 text-nightly-lavender-floral font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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
    </Card>
  );
};

const KeyholderDurationDisplay: React.FC<{
  goal: DBGoal;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ goal, onEdit, onDelete }) => {
  return (
    <Card variant="glass" padding="lg" className="border-2 border-nightly-lavender-floral">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FaLock className="text-nightly-lavender-floral text-xl" />
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

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-nightly-lavender-floral"
            title="Edit duration"
          >
            <FaEdit />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
            title="Remove requirement"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <div className="bg-nightly-lavender-floral/10 rounded-lg p-4">
        <p className="text-sm text-nightly-celadon mb-1">
          Minimum Required Duration
        </p>
        <p className="text-2xl font-bold text-nightly-lavender-floral">
          {formatDuration(goal.targetValue)}
        </p>
      </div>
    </Card>
  );
};

const KeyholderDurationCard: React.FC<{
  goal: DBGoal;
  onUpdate: (
    goalId: string,
    title: string,
    duration: number,
    description?: string,
  ) => void;
  onDelete: (goalId: string) => void;
}> = ({ goal, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (
    title: string,
    duration: number,
    description?: string,
  ) => {
    onUpdate(goal.id, title, duration, description);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <KeyholderDurationEditForm
        goal={goal}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <KeyholderDurationDisplay
      goal={goal}
      onEdit={() => setIsEditing(true)}
      onDelete={() => onDelete(goal.id)}
    />
  );
};

const CreateKeyholderDurationForm: React.FC<{
  onCreate: (title: string, duration: number, description?: string) => void;
  isCreating: boolean;
}> = ({ onCreate, isCreating }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Minimum Lock Duration");
  const [days, setDays] = useState(3);
  const [hours, setHours] = useState(0);
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const totalSeconds = days * 86400 + hours * 3600;
    if (totalSeconds <= 0) return;

    onCreate(title.trim(), totalSeconds, description.trim() || undefined);

    setTitle("Minimum Lock Duration");
    setDays(3);
    setHours(0);
    setDescription("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Card
        variant="glass"
        padding="lg"
        onClick={() => setIsOpen(true)}
        className="hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-nightly-lavender-floral font-semibold border-2 border-nightly-lavender-floral/30 cursor-pointer"
      >
        <FaLock /> Set Required Duration
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="lg" className="border-2 border-nightly-lavender-floral">
      <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
        Set Required Duration
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Requirement Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-lavender-floral"
            placeholder="Minimum lock duration"
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Required Duration
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-lavender-floral"
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
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-lavender-floral"
                disabled={isCreating}
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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-lavender-floral resize-none"
            rows={2}
            placeholder="Why this duration is required..."
            disabled={isCreating}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isCreating || (days === 0 && hours === 0)}
            className="flex-1 bg-nightly-lavender-floral/20 border border-nightly-lavender-floral hover:bg-nightly-lavender-floral/30 text-nightly-lavender-floral font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              "Creating..."
            ) : (
              <>
                <FaLock /> Set Duration
              </>
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            disabled={isCreating}
            className="flex-1 bg-white/5 border border-white/20 hover:bg-white/10 text-nightly-celadon font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FaTimes /> Cancel
          </button>
        </div>
      </div>
    </Card>
  );
};

export const KeyholderDurationSection: React.FC<
  KeyholderDurationSectionProps
> = ({ userId }) => {
  const { data: khDuration, isLoading } = useKeyholderRequiredDurationQuery(
    userId || undefined,
  );
  const {
    createKeyholderDuration,
    updateKeyholderDuration,
    deletePersonalGoal,
  } = usePersonalGoalMutations();
  const { showWarning } = useToast();

  const handleCreate = (
    title: string,
    duration: number,
    description?: string,
  ) => {
    if (!userId) return;
    createKeyholderDuration.mutate({
      userId,
      title,
      requiredDuration: duration,
      description,
    });
  };

  const handleUpdate = (
    goalId: string,
    title: string,
    duration: number,
    description?: string,
  ) => {
    if (!userId) return;
    updateKeyholderDuration.mutate({
      goalId,
      userId,
      requiredDuration: duration,
      title,
      description,
    });
  };

  const handleDelete = (goalId: string) => {
    if (!userId) return;
    showWarning("Are you sure you want to remove the required duration?", {
      duration: 5000,
      action: {
        label: "Remove",
        onClick: () => {
          deletePersonalGoal.mutate({ goalId, userId });
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card variant="glass" padding="lg">
          <p className="text-nightly-celadon">Loading keyholder settings...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="glass" padding="lg">
        <h2 className="text-2xl font-bold text-nightly-honeydew mb-2">
          Keyholder Required Duration
        </h2>
        <p className="text-nightly-celadon">
          Set a minimum duration that must be completed before unlock is
          allowed. This requirement is enforced by the keyholder.
        </p>
      </Card>

      {khDuration ? (
        <KeyholderDurationCard
          goal={khDuration}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : (
        <CreateKeyholderDurationForm
          onCreate={handleCreate}
          isCreating={createKeyholderDuration.isPending}
        />
      )}
    </div>
  );
};
