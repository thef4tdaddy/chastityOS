/**
 * NotificationPromptSteps Component
 * Step components for notification permission prompt
 */
import React from "react";
import { Button } from "@/components/ui";

// Initial Prompt Step with benefits
interface InitialPromptStepProps {
  onRequestPermission: () => void;
  onDismiss: () => void;
  onShowExplanation: () => void;
  isRequesting: boolean;
}

export const InitialPromptStep: React.FC<InitialPromptStepProps> = ({
  onRequestPermission,
  onDismiss,
  onShowExplanation,
  isRequesting,
}) => {
  return (
    <>
      {/* Description */}
      <div className="space-y-3 mb-6">
        <p className="text-purple-300 text-center text-sm">
          Get notified about important updates:
        </p>
        <ul className="space-y-2 text-purple-300 text-sm">
          <li className="flex items-start">
            <svg
              className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Task assignments from your Keyholder</span>
          </li>
          <li className="flex items-start">
            <svg
              className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Task approvals and feedback</span>
          </li>
          <li className="flex items-start">
            <svg
              className="w-5 h-5 text-purple-400 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Upcoming task deadlines</span>
          </li>
        </ul>
        <Button
          variant="ghost"
          onClick={onShowExplanation}
          className="text-purple-400 hover:text-purple-300 text-xs underline mt-2 w-full"
        >
          Why do we need this permission?
        </Button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          onClick={onRequestPermission}
          disabled={isRequesting}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg"
        >
          {isRequesting ? "Requesting..." : "Enable Notifications"}
        </Button>
        <Button
          variant="ghost"
          onClick={onDismiss}
          disabled={isRequesting}
          className="w-full bg-transparent hover:bg-purple-800 text-purple-300 font-semibold py-2 px-4 rounded-lg border border-purple-600"
        >
          Maybe Later
        </Button>
      </div>
    </>
  );
};

// Explanation Step
interface ExplanationStepProps {
  onBack: () => void;
}

export const ExplanationStep: React.FC<ExplanationStepProps> = ({ onBack }) => {
  return (
    <div className="space-y-3 mb-6">
      <p className="text-purple-300 text-sm">
        Push notifications allow us to send you timely updates even when you're
        not actively using the app. This helps you stay on top of:
      </p>
      <ul className="space-y-2 text-purple-300 text-sm list-disc list-inside">
        <li>New tasks assigned by your Keyholder</li>
        <li>Task review results (approved/rejected)</li>
        <li>Approaching and overdue task deadlines</li>
        <li>Important system updates</li>
      </ul>
      <p className="text-purple-400 text-xs italic">
        You can disable notifications at any time in your device settings or app
        settings.
      </p>
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-purple-400 hover:text-purple-300 text-xs underline mt-2 w-full"
      >
        Back
      </Button>
    </div>
  );
};
