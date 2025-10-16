import React from "react";
import { Switch } from "@/components/ui";

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
  <Switch
    label={label}
    description={description}
    checked={checked}
    onCheckedChange={onChange}
  />
);
