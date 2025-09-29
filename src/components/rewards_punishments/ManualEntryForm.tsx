import React, { useState } from "react";
import { RewardPunishmentLog } from "./LogItem";
import { FaPlus } from "../../utils/iconImport";

// Manual Entry Form Component
interface ManualEntryFormProps {
  onSubmit: (entry: Omit<RewardPunishmentLog, "id" | "createdAt">) => void;
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  onSubmit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "reward" as "reward" | "punishment",
    title: "",
    description: "",
    timeChangeSeconds: 3600, // Default 1 hour
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      ...formData,
      timeChangeSeconds:
        formData.type === "reward"
          ? -Math.abs(formData.timeChangeSeconds)
          : Math.abs(formData.timeChangeSeconds),
      source: "keyholder_action",
    });

    // Reset form
    setFormData({
      type: "reward",
      title: "",
      description: "",
      timeChangeSeconds: 3600,
      notes: "",
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
      >
        <FaPlus />
        Add Manual Entry
      </button>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-nightly-honeydew mb-4">
        Manual Reward/Punishment
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="reward"
                checked={formData.type === "reward"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as "reward" | "punishment",
                  }))
                }
                className="mr-2"
              />
              <span className="text-green-400">Reward</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="punishment"
                checked={formData.type === "punishment"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as "reward" | "punishment",
                  }))
                }
                className="mr-2"
              />
              <span className="text-red-400">Punishment</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Brief title for this entry"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Detailed description of the reason"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={3}
            required
          />
        </div>

        {/* Time Change */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Time Impact (hours)
          </label>
          <input
            type="number"
            min="0"
            max="168"
            step="0.5"
            value={formData.timeChangeSeconds / 3600}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                timeChangeSeconds: parseFloat(e.target.value) * 3600,
              }))
            }
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew"
          />
          <div className="text-xs text-nightly-celadon mt-1">
            This will {formData.type === "reward" ? "reduce" : "add"} chastity
            time
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Additional notes or comments"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors"
          >
            Add Entry
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-6 py-2 rounded font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
