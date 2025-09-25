import React, { useState } from "react";
import { ChastityRule } from "./RuleCard";
import { FaEdit, FaSave, FaTimes } from "../../utils/iconImport";

// Rule Editor Component
interface RuleEditorProps {
  rule: ChastityRule | null;
  onSave: (
    rule: Omit<ChastityRule, "id" | "createdAt" | "lastModified">,
  ) => void;
  onCancel: () => void;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: rule?.title || "",
    content: rule?.content || "",
    isActive: rule?.isActive ?? true,
    createdBy: rule?.createdBy || ("submissive" as "submissive" | "keyholder"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaEdit className="text-nightly-aquamarine" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          {rule ? "Edit Rule" : "Create New Rule"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Rule Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter a clear, descriptive title"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Rule Content
            <span className="text-xs text-nightly-celadon/70 ml-2">
              (Supports basic markdown: **bold**, bullet points with -)
            </span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            placeholder={`Describe the rule in detail, including:

**Requirements:**
- What needs to be done
- When it needs to be done
- How to provide evidence

**Consequences:**
- For following the rule (rewards)
- For breaking the rule (punishments)

**Additional notes:**
- Any special circumstances
- Exceptions or modifications`}
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none font-mono text-sm"
            rows={12}
            required
          />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Created By
            </label>
            <select
              value={formData.createdBy}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  createdBy: e.target.value as "submissive" | "keyholder",
                }))
              }
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew"
            >
              <option value="submissive">Submissive</option>
              <option value="keyholder">Keyholder</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="mr-2"
              />
              <span className="text-nightly-celadon">Rule is active</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
          >
            <FaSave />
            {rule ? "Update Rule" : "Create Rule"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
          >
            <FaTimes />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
