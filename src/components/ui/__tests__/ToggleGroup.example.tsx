/**
 * ToggleGroup Component Examples
 * Visual demonstration of the ToggleGroup component in various configurations
 */
import React, { useState } from "react";
import { ToggleGroup, ToggleGroupOption } from "../ToggleGroup";
import {
  FaSun,
  FaMoon,
  FaDesktop,
  FaEnvelope,
  FaBell,
  FaSms,
  FaFilter,
  FaCalendar,
} from "react-icons/fa";

/**
 * Example 1: Basic Single Select
 */
export const BasicSingleSelectExample: React.FC = () => {
  const [value, setValue] = useState<string>("option1");

  const options: ToggleGroupOption[] = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  return (
    <div className="space-y-4 p-6 bg-gray-900 rounded-lg">
      <h3 className="text-xl font-bold text-white">Basic Single Select</h3>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={setValue}
        options={options}
        aria-label="Basic example"
      />
      <p className="text-sm text-gray-400">Selected: {value}</p>
    </div>
  );
};

/**
 * Example 2: Theme Selector with Icons
 */
export const ThemeSelectorExample: React.FC = () => {
  const [theme, setTheme] = useState<string>("light");

  const options: ToggleGroupOption[] = [
    { value: "light", label: "Light", icon: <FaSun /> },
    { value: "dark", label: "Dark", icon: <FaMoon /> },
    { value: "system", label: "System", icon: <FaDesktop /> },
  ];

  return (
    <div className="space-y-4 p-6 bg-gray-900 rounded-lg">
      <h3 className="text-xl font-bold text-white">Theme Selector</h3>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={setTheme}
        options={options}
        size="md"
        aria-label="Select theme"
      />
      <p className="text-sm text-gray-400">Current theme: {theme}</p>
    </div>
  );
};

/**
 * Example 3: Multiple Select (Notification Preferences)
 */
export const MultipleSelectExample: React.FC = () => {
  const [selected, setSelected] = useState<string[]>(["email", "push"]);

  const options: ToggleGroupOption[] = [
    { value: "email", label: "Email", icon: <FaEnvelope /> },
    { value: "push", label: "Push", icon: <FaBell /> },
    { value: "sms", label: "SMS", icon: <FaSms /> },
  ];

  return (
    <div className="space-y-4 p-6 bg-gray-900 rounded-lg">
      <h3 className="text-xl font-bold text-white">
        Multiple Select - Notifications
      </h3>
      <ToggleGroup
        type="multiple"
        value={selected}
        onValueChange={setSelected}
        options={options}
        size="md"
        aria-label="Select notification preferences"
      />
      <p className="text-sm text-gray-400">
        Selected: {selected.join(", ") || "none"}
      </p>
    </div>
  );
};

/**
 * Example 4: Size Variants
 */
export const SizeVariantsExample: React.FC = () => {
  const [smallValue, setSmallValue] = useState<string>("s");
  const [mediumValue, setMediumValue] = useState<string>("m");
  const [largeValue, setLargeValue] = useState<string>("l");

  const options: ToggleGroupOption[] = [
    { value: "s", label: "Small" },
    { value: "m", label: "Medium" },
    { value: "l", label: "Large" },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg">
      <h3 className="text-xl font-bold text-white">Size Variants</h3>

      <div className="space-y-2">
        <p className="text-sm text-gray-400">Small (sm)</p>
        <ToggleGroup
          type="single"
          value={smallValue}
          onValueChange={setSmallValue}
          options={options}
          size="sm"
          aria-label="Small size example"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-400">Medium (md) - Default</p>
        <ToggleGroup
          type="single"
          value={mediumValue}
          onValueChange={setMediumValue}
          options={options}
          size="md"
          aria-label="Medium size example"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-400">Large (lg)</p>
        <ToggleGroup
          type="single"
          value={largeValue}
          onValueChange={setLargeValue}
          options={options}
          size="lg"
          aria-label="Large size example"
        />
      </div>
    </div>
  );
};

/**
 * Example 5: Full Width Layout
 */
export const FullWidthExample: React.FC = () => {
  const [view, setView] = useState<string>("week");

  const options: ToggleGroupOption[] = [
    { value: "day", label: "Day", icon: <FaCalendar /> },
    { value: "week", label: "Week", icon: <FaCalendar /> },
    { value: "month", label: "Month", icon: <FaCalendar /> },
    { value: "year", label: "Year", icon: <FaCalendar /> },
  ];

  return (
    <div className="space-y-4 p-6 bg-gray-900 rounded-lg">
      <h3 className="text-xl font-bold text-white">Full Width Layout</h3>
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={setView}
        options={options}
        fullWidth={true}
        size="md"
        aria-label="Select calendar view"
      />
      <p className="text-sm text-gray-400">Current view: {view}</p>
    </div>
  );
};

/**
 * Example 6: With Disabled Options
 */
export const DisabledOptionsExample: React.FC = () => {
  const [filter, setFilter] = useState<string>("all");

  const options: ToggleGroupOption[] = [
    { value: "all", label: "All", icon: <FaFilter /> },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived", disabled: true },
  ];

  return (
    <div className="space-y-4 p-6 bg-gray-900 rounded-lg">
      <h3 className="text-xl font-bold text-white">With Disabled Options</h3>
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={setFilter}
        options={options}
        size="md"
        aria-label="Filter tasks"
      />
      <p className="text-sm text-gray-400">
        Current filter: {filter}
        <br />
        <span className="text-gray-500">(Archived option is disabled)</span>
      </p>
    </div>
  );
};

/**
 * Complete Examples Showcase
 */
export const ToggleGroupShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            ToggleGroup Component
          </h1>
          <p className="text-gray-400">
            A comprehensive, accessible button group component with single and
            multiple select modes
          </p>
        </div>

        <BasicSingleSelectExample />
        <ThemeSelectorExample />
        <MultipleSelectExample />
        <SizeVariantsExample />
        <FullWidthExample />
        <DisabledOptionsExample />

        <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">
            Keyboard Navigation
          </h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Arrow Left/Up: Previous option</li>
            <li>• Arrow Right/Down: Next option</li>
            <li>• Home: First option</li>
            <li>• End: Last option</li>
            <li>• Space/Enter: Select option</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ToggleGroupShowcase;
