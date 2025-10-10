import React, { useState } from "react";
import { RewardPunishmentLog } from "./LogItem";
import { FaPlus } from "../../utils/iconImport";
import { Input, Textarea } from "@/components/ui";

// Form data type
type FormData = {
  type: "reward" | "punishment";
  title: string;
  description: string;
  timeChangeSeconds: number;
  notes: string;
};

// Type Selection Component
const TypeSelection: React.FC<{
  type: "reward" | "punishment";
  onChange: (type: "reward" | "punishment") => void;
}> = ({ type, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-nightly-celadon mb-2">
      Type
    </label>
    <div className="flex gap-4">
      <label className="flex items-center">
        <input
          type="radio"
          value="reward"
          checked={type === "reward"}
          onChange={(e) => onChange(e.target.value as "reward" | "punishment")}
          className="mr-2"
        />
        <span className="text-green-400">Reward</span>
      </label>
      <label className="flex items-center">
        <input
          type="radio"
          value="punishment"
          checked={type === "punishment"}
          onChange={(e) => onChange(e.target.value as "reward" | "punishment")}
          className="mr-2"
        />
        <span className="text-red-400">Punishment</span>
      </label>
    </div>
  </div>
);

// Title Input Component
const TitleInput: React.FC<{
  title: string;
  onChange: (title: string) => void;
}> = ({ title, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-nightly-celadon mb-2">
      Title
    </label>
    <Input
      type="text"
      value={title}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Brief title for this entry"
      className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
      required
    />
  </div>
);

// Description Input Component
const DescriptionInput: React.FC<{
  description: string;
  onChange: (description: string) => void;
}> = ({ description, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-nightly-celadon mb-2">
      Description
    </label>
    <Textarea
      value={description}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Detailed description of the reason"
      className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
      rows={3}
      required
    />
  </div>
);

// Time Impact Input Component
const TimeImpactInput: React.FC<{
  timeChangeSeconds: number;
  type: "reward" | "punishment";
  onChange: (timeChangeSeconds: number) => void;
}> = ({ timeChangeSeconds, type, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-nightly-celadon mb-2">
      Time Impact (hours)
    </label>
    <Input
      type="number"
      min="0"
      max="168"
      step="0.5"
      value={timeChangeSeconds / 3600}
      onChange={(e) => onChange(parseFloat(e.target.value) * 3600)}
      className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew"
    />
    <div className="text-xs text-nightly-celadon mt-1">
      This will {type === "reward" ? "reduce" : "add"} chastity time
    </div>
  </div>
);

// Notes Input Component
const NotesInput: React.FC<{
  notes: string;
  onChange: (notes: string) => void;
}> = ({ notes, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-nightly-celadon mb-2">
      Notes (optional)
    </label>
    <Textarea
      value={notes}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Additional notes or comments"
      className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
      rows={2}
    />
  </div>
);

// Form Actions Component
const FormActions: React.FC<{
  onCancel: () => void;
}> = ({ onCancel }) => (
  <div className="flex gap-3">
    <button
      type="submit"
      className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors"
    >
      Add Entry
    </button>
    <button
      type="button"
      onClick={onCancel}
      className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-6 py-2 rounded font-medium transition-colors"
    >
      Cancel
    </button>
  </div>
);

// Custom hook for form data management
const useFormData = () => {
  const [formData, setFormData] = useState<FormData>({
    type: "reward",
    title: "",
    description: "",
    timeChangeSeconds: 3600, // Default 1 hour
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      type: "reward",
      title: "",
      description: "",
      timeChangeSeconds: 3600,
      notes: "",
    });
  };

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return { formData, resetForm, updateField };
};

// Manual Entry Form Component
interface ManualEntryFormProps {
  onSubmit: (entry: Omit<RewardPunishmentLog, "id" | "createdAt">) => void;
}

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  onSubmit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { formData, resetForm, updateField } = useFormData();

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

    resetForm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    resetForm();
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
        <TypeSelection
          type={formData.type}
          onChange={(type) => updateField("type", type)}
        />

        <TitleInput
          title={formData.title}
          onChange={(title) => updateField("title", title)}
        />

        <DescriptionInput
          description={formData.description}
          onChange={(description) => updateField("description", description)}
        />

        <TimeImpactInput
          timeChangeSeconds={formData.timeChangeSeconds}
          type={formData.type}
          onChange={(timeChangeSeconds) =>
            updateField("timeChangeSeconds", timeChangeSeconds)
          }
        />

        <NotesInput
          notes={formData.notes}
          onChange={(notes) => updateField("notes", notes)}
        />

        <FormActions onCancel={handleCancel} />
      </form>
    </div>
  );
};
