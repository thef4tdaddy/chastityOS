/**
 * Toast Demo Page - Test all toast system features
 * Demonstrates priority levels, animations, accessibility, and bridge functionality
 */
import React from "react";
import { useToast } from "../../contexts";
import { safeToastFunctions } from "../../utils/toastBridge";
import { Button } from "@/components/ui";

const ToastDemo: React.FC = () => {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showUrgent,
    showHigh,
    showMedium,
    showLow,
    clearAllToasts,
  } = useToast();

  const testBasicToasts = () => {
    showSuccess("Success message!");
    showError("Error message!");
    showWarning("Warning message!");
    showInfo("Info message!");
  };

  const testPriorityToasts = () => {
    showLow("Low priority message");
    showMedium("Medium priority message");
    showHigh("High priority message");
    showUrgent("Urgent priority message - requires interaction!");
  };

  const testAdvancedToasts = () => {
    showSuccess("Success with action", {
      title: "Operation Complete",
      action: {
        label: "View Details",
        onClick: () => showInfo("Action clicked!"),
      },
    });

    showError("Persistent error", {
      title: "Critical Error",
      duration: 0, // Persistent
      action: {
        label: "Report Bug",
        onClick: () => showSuccess("Bug reported!"),
      },
    });

    showWarning("Custom positioned toast", {
      title: "Warning",
      position: "bottom-left",
      duration: 3000,
    });
  };

  const testBridgeFunctions = () => {
    // Test non-React service integration
    safeToastFunctions.showSuccess("Bridge success message!");
    safeToastFunctions.showError("Bridge error message!");
    safeToastFunctions.showWarning("Bridge warning message!");
    safeToastFunctions.showInfo("Bridge info message!");
    safeToastFunctions.showUrgent("Bridge urgent message!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Toast System Demo
        </h1>
        <p className="text-gray-400">
          Test the new global toast utility with priority levels and animations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Toast Types */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Basic Toast Types
          </h2>
          <div className="space-y-3">
            <Button
              onClick={testBasicToasts}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Show All Basic Types
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => showSuccess("Success!")}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              >
                Success
              </Button>
              <Button
                onClick={() => showError("Error!")}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Error
              </Button>
              <Button
                onClick={() => showWarning("Warning!")}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
              >
                Warning
              </Button>
              <Button
                onClick={() => showInfo("Info!")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Info
              </Button>
            </div>
          </div>
        </div>

        {/* Priority Levels */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Priority Levels
          </h2>
          <div className="space-y-3">
            <Button
              onClick={testPriorityToasts}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Show All Priorities
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => showLow("Low priority")}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
              >
                Low
              </Button>
              <Button
                onClick={() => showMedium("Medium priority")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Medium
              </Button>
              <Button
                onClick={() => showHigh("High priority")}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm"
              >
                High
              </Button>
              <Button
                onClick={() => showUrgent("Urgent priority!")}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm animate-pulse"
              >
                Urgent
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Advanced Features
          </h2>
          <div className="space-y-3">
            <Button
              onClick={testAdvancedToasts}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Show Advanced Examples
            </Button>
            <p className="text-sm text-gray-400">
              Includes: Custom titles, action buttons, positioning, and
              persistent toasts
            </p>
          </div>
        </div>

        {/* Bridge Functions */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">
            Bridge Functions
          </h2>
          <div className="space-y-3">
            <Button
              onClick={testBridgeFunctions}
              className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              Test Non-React Bridge
            </Button>
            <p className="text-sm text-gray-400">
              Tests toasts from non-React services (like NotificationService)
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>
        <div className="flex gap-4">
          <Button
            onClick={clearAllToasts}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Clear All Toasts
          </Button>
        </div>
      </div>

      {/* Accessibility Info */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">
          Accessibility Features
        </h2>
        <ul className="text-gray-300 space-y-2 text-sm">
          <li>
            • <strong>Keyboard Navigation:</strong> Use Tab to navigate, Enter
            to activate actions, Escape to dismiss
          </li>
          <li>
            • <strong>Screen Reader Support:</strong> aria-live regions for
            announcements
          </li>
          <li>
            • <strong>Focus Management:</strong> Urgent toasts automatically
            receive focus
          </li>
          <li>
            • <strong>Priority-Based Styling:</strong> Visual and semantic
            importance indicators
          </li>
          <li>
            • <strong>Dismissible Controls:</strong> Clear close buttons with
            proper labels
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ToastDemo;
