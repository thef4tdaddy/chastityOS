/**
 * Task Creation With Recurring Example
 * Example component showing how to integrate recurring task creation
 */
import React, { useState } from "react";
import { RecurringTaskForm } from "./RecurringTaskForm";
import type { RecurringConfig } from "@/types/database";
import { FaSync } from "../../utils/iconImport";
import { Input, Textarea, Checkbox } from "@/components/ui";

interface TaskCreationWithRecurringProps {
  onCreateTask: (taskData: {
    text: string;
    description?: string;
    isRecurring?: boolean;
    recurringConfig?: RecurringConfig;
  }) => void;
}

/**
 * Example component showing how to integrate recurring task creation
 * This can be used as a reference for updating the main TaskManagement component
 */
export const TaskCreationWithRecurring: React.FC<
  TaskCreationWithRecurringProps
> = ({ onCreateTask }) => {
  const [taskText, setTaskText] = useState("");
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState<
    RecurringConfig | undefined
  >(undefined);

  const handleSubmit = () => {
    if (!taskText.trim()) return;

    onCreateTask({
      text: taskText,
      description: description || undefined,
      isRecurring,
      recurringConfig: isRecurring ? recurringConfig : undefined,
    });

    // Reset form
    setTaskText("");
    setDescription("");
    setIsRecurring(false);
    setRecurringConfig(undefined);
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-white">Create Task</h3>

      {/* Task Text */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Task Title
        </label>
        <Input
          type="text"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          placeholder="Enter task title..."
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description (optional)
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description..."
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      {/* Recurring Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isRecurring"
          checked={isRecurring}
          onChange={setIsRecurring}
        />
        <label
          htmlFor="isRecurring"
          className="text-sm font-medium text-gray-300 flex items-center gap-2"
        >
          <FaSync className="text-blue-400" />
          Make this a recurring task
        </label>
      </div>

      {/* Recurring Configuration */}
      {isRecurring && (
        <RecurringTaskForm
          onSave={(config) => setRecurringConfig(config)}
          initialConfig={recurringConfig}
        />
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!taskText.trim() || (isRecurring && !recurringConfig)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
      >
        Create Task
      </button>
    </div>
  );
};
