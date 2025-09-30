import React from "react";

interface ToggleSwitchProps {
  label: string;
  description: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  description,
  checked = false,
  onChange,
}) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-medium text-nightly-celadon">{label}</div>
      <div className="text-xs text-nightly-celadon/70">{description}</div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
    </label>
  </div>
);
