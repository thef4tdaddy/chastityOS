/**
 * Recurring Task Form Component
 * UI for configuring recurring task settings
 */
import React, { useState } from "react";
import type { RecurringConfig } from "@/types/database";
import { Button, Input } from "@/components/ui";

interface RecurringTaskFormProps {
  onSave: (config: RecurringConfig) => void;
  initialConfig?: RecurringConfig;
}

export const RecurringTaskForm: React.FC<RecurringTaskFormProps> = ({
  onSave,
  initialConfig,
}) => {
  const [frequency, setFrequency] = useState<
    "daily" | "weekly" | "monthly" | "custom"
  >(initialConfig?.frequency || "weekly");
  const [interval, setInterval] = useState(initialConfig?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialConfig?.daysOfWeek || [],
  );
  const [dayOfMonth, setDayOfMonth] = useState(initialConfig?.dayOfMonth || 1);

  const handleSave = () => {
    const config: RecurringConfig = {
      frequency,
      interval:
        frequency === "daily" || frequency === "custom" ? interval : undefined,
      daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
    };
    onSave(config);
  };

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const weekDays = [
    { label: "Sun", value: 0 },
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
  ];

  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white">
        Recurring Task Settings
      </h3>

      {/* Frequency Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Frequency
        </label>
        <Select
          value={frequency}
          onChange={(e) =>
            setFrequency(e.target.value as RecurringConfig["frequency"])
          }
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom Interval</option>
        </Select>
      </div>

      {/* Daily Interval */}
      {frequency === "daily" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Repeat every (days)
          </label>
          <Input
            type="number"
            min="1"
            max="365"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Weekly Days Selection */}
      {frequency === "weekly" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Days of Week
          </label>
          <div className="flex flex-wrap gap-2">
            {weekDays.map((day) => (
              <Button
                key={day.value}
                type="button"
                onClick={() => toggleDayOfWeek(day.value)}
                className={`px-4 py-2 rounded transition-colors ${
                  daysOfWeek.includes(day.value)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {day.label}
              </Button>
            ))}
          </div>
          {daysOfWeek.length === 0 && (
            <p className="text-sm text-red-400 mt-1">Select at least one day</p>
          )}
        </div>
      )}

      {/* Monthly Day Selection */}
      {frequency === "monthly" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Day of Month
          </label>
          <Input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Custom Interval */}
      {frequency === "custom" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Repeat every (days)
          </label>
          <Input
            type="number"
            min="1"
            max="365"
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Number of days"
          />
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={frequency === "weekly" && daysOfWeek.length === 0}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
      >
        Save Recurring Settings
      </Button>
    </div>
  );
};
