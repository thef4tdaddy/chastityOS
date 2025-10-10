/**
 * ToggleGroup Demo Component
 * Demonstrates the usage of the ToggleGroup component
 */
import React, { useState } from "react";
import { ToggleGroup } from "@/components/ui";
import { FaSun, FaMoon, FaCloud } from "react-icons/fa";

export const ToggleGroupDemo: React.FC = () => {
  // Single select example
  const [singleValue, setSingleValue] = useState<string>("option2");

  // Multiple select example
  const [multipleValues, setMultipleValues] = useState<string[]>([
    "option1",
    "option3",
  ]);

  // Weather example with icons
  const [weather, setWeather] = useState<string>("sunny");

  // Size examples
  const [size, setSize] = useState<string>("md");

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-nightly-honeydew mb-2">
          ToggleGroup Component Demo
        </h1>
        <p className="text-nightly-celadon">
          A standardized component for mutually exclusive button selections
        </p>
      </div>

      {/* Single Select Mode */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Single Select Mode
        </h2>
        <p className="text-sm text-nightly-celadon mb-4">
          Radio-like behavior where only one option can be selected at a time
        </p>
        <ToggleGroup
          value={singleValue}
          onValueChange={(value) => setSingleValue(value as string)}
          options={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" },
          ]}
          type="single"
          aria-label="Single select example"
        />
        <p className="text-xs text-nightly-celadon mt-3">
          Selected: <span className="font-semibold">{singleValue}</span>
        </p>
      </div>

      {/* Multiple Select Mode */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Multiple Select Mode
        </h2>
        <p className="text-sm text-nightly-celadon mb-4">
          Checkbox-like behavior where multiple options can be selected
        </p>
        <ToggleGroup
          value={multipleValues}
          onValueChange={(value) => setMultipleValues(value as string[])}
          options={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" },
            { value: "option4", label: "Option 4" },
          ]}
          type="multiple"
          aria-label="Multiple select example"
        />
        <p className="text-xs text-nightly-celadon mt-3">
          Selected:{" "}
          <span className="font-semibold">{multipleValues.join(", ")}</span>
        </p>
      </div>

      {/* With Icons */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          With Icons
        </h2>
        <p className="text-sm text-nightly-celadon mb-4">
          Options can include icons for better visual representation
        </p>
        <ToggleGroup
          value={weather}
          onValueChange={(value) => setWeather(value as string)}
          options={[
            { value: "sunny", label: "Sunny", icon: <FaSun /> },
            { value: "cloudy", label: "Cloudy", icon: <FaCloud /> },
            { value: "night", label: "Night", icon: <FaMoon /> },
          ]}
          type="single"
          aria-label="Weather selection"
        />
        <p className="text-xs text-nightly-celadon mt-3">
          Selected: <span className="font-semibold">{weather}</span>
        </p>
      </div>

      {/* Size Variants */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Size Variants
        </h2>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-nightly-celadon mb-2">Small</p>
            <ToggleGroup
              value={size}
              onValueChange={(value) => setSize(value as string)}
              options={[
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
              type="single"
              size="sm"
              aria-label="Size selection small"
            />
          </div>
          <div>
            <p className="text-sm text-nightly-celadon mb-2">
              Medium (Default)
            </p>
            <ToggleGroup
              value={size}
              onValueChange={(value) => setSize(value as string)}
              options={[
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
              type="single"
              size="md"
              aria-label="Size selection medium"
            />
          </div>
          <div>
            <p className="text-sm text-nightly-celadon mb-2">Large</p>
            <ToggleGroup
              value={size}
              onValueChange={(value) => setSize(value as string)}
              options={[
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
              type="single"
              size="lg"
              aria-label="Size selection large"
            />
          </div>
        </div>
      </div>

      {/* Full Width */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Full Width
        </h2>
        <p className="text-sm text-nightly-celadon mb-4">
          Buttons can be set to fill the full width of their container
        </p>
        <ToggleGroup
          value="option2"
          onValueChange={() => {}}
          options={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" },
          ]}
          type="single"
          fullWidth
          aria-label="Full width example"
        />
      </div>

      {/* Disabled Options */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Disabled Options
        </h2>
        <p className="text-sm text-nightly-celadon mb-4">
          Individual options can be disabled
        </p>
        <ToggleGroup
          value="option1"
          onValueChange={() => {}}
          options={[
            { value: "option1", label: "Enabled" },
            { value: "option2", label: "Disabled", disabled: true },
            { value: "option3", label: "Enabled" },
          ]}
          type="single"
          aria-label="Disabled options example"
        />
      </div>

      {/* Keyboard Navigation */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-nightly-honeydew mb-4">
          Keyboard Navigation
        </h2>
        <p className="text-sm text-nightly-celadon mb-4">
          Use <kbd className="px-2 py-1 bg-gray-700 rounded">Tab</kbd> to focus,{" "}
          <kbd className="px-2 py-1 bg-gray-700 rounded">Enter</kbd> or{" "}
          <kbd className="px-2 py-1 bg-gray-700 rounded">Space</kbd> to select
        </p>
        <ToggleGroup
          value="option1"
          onValueChange={() => {}}
          options={[
            { value: "option1", label: "Option 1" },
            { value: "option2", label: "Option 2" },
            { value: "option3", label: "Option 3" },
          ]}
          type="single"
          aria-label="Keyboard navigation example"
        />
      </div>
    </div>
  );
};

export default ToggleGroupDemo;
