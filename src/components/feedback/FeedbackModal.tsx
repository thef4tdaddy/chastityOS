// src/components/feedback/FeedbackModal.tsx

import React, { useState } from "react";
import {
  FaBug,
  FaLightbulb,
  FaComment,
  FaTimes,
  FaPaperPlane,
} from "react-icons/fa";
import type { FeedbackModalProps, FeedbackData } from "../../types/feedback";
import { collectSystemInfo } from "../../utils/systemInfo";

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  type,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    steps: "", // For bug reports
    expected: "", // For bug reports
    actual: "", // For bug reports
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    contactEmail: "",
    includeSystemInfo: true,
    screenshot: null as File | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!type) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type,
        ...formData,
        systemInfo: formData.includeSystemInfo
          ? await collectSystemInfo()
          : null,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.pathname,
      };

      await onSubmit(feedbackData);
      onClose();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      // Error handling is done in the service
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case "bug":
        return "Report a Bug";
      case "feature":
        return "Suggest a Feature";
      case "general":
        return "General Feedback";
      default:
        return "Feedback";
    }
  };

  const getModalIcon = () => {
    switch (type) {
      case "bug":
        return <FaBug className="text-red-400" />;
      case "feature":
        return <FaLightbulb className="text-blue-400" />;
      case "general":
        return <FaComment className="text-green-400" />;
      default:
        return <FaComment className="text-green-400" />;
    }
  };

  const getTitlePlaceholder = () => {
    switch (type) {
      case "bug":
        return "Brief description of the bug";
      case "feature":
        return "Short title for your feature request";
      case "general":
        return "Summary of your feedback";
      default:
        return "Brief title";
    }
  };

  const getDescriptionPlaceholder = () => {
    switch (type) {
      case "bug":
        return "Describe what happened and what you expected to happen";
      case "feature":
        return "Describe your feature idea and how it would help";
      case "general":
        return "Share your thoughts and suggestions";
      default:
        return "Describe your feedback";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 max-w-2xl w-full max-h-[90vh] rounded-lg border border-gray-600 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            {getModalIcon()}
            <h2 className="text-xl font-bold text-white">{getModalTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <FaTimes className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[70vh] space-y-4"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {type === "bug"
                ? "Bug Summary"
                : type === "feature"
                  ? "Feature Title"
                  : "Feedback Title"}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={getTitlePlaceholder()}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder={getDescriptionPlaceholder()}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Bug-specific fields */}
          {type === "bug" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Steps to Reproduce
                  </label>
                  <textarea
                    value={formData.steps}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        steps: e.target.value,
                      }))
                    }
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as any,
                      }))
                    }
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="low">Low - Minor inconvenience</option>
                    <option value="medium">
                      Medium - Affects functionality
                    </option>
                    <option value="high">High - Prevents core features</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Behavior
                  </label>
                  <textarea
                    value={formData.expected}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expected: e.target.value,
                      }))
                    }
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What should have happened?"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Actual Behavior
                  </label>
                  <textarea
                    value={formData.actual}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        actual: e.target.value,
                      }))
                    }
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What actually happened?"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </>
          )}

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Screenshot (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  screenshot: e.target.files?.[0] || null,
                }))
              }
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-white file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
              disabled={isSubmitting}
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Email (Optional)
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contactEmail: e.target.value,
                }))
              }
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com (if you want updates)"
              disabled={isSubmitting}
            />
          </div>

          {/* System Info Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-300">
                Include System Information
              </div>
              <div className="text-xs text-gray-500">
                Helps us debug technical issues
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeSystemInfo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    includeSystemInfo: e.target.checked,
                  }))
                }
                className="sr-only peer"
                disabled={isSubmitting}
              />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-6 py-3 rounded font-medium transition-colors flex items-center gap-2"
            >
              <FaPaperPlane />
              {isSubmitting
                ? "Submitting..."
                : `Submit ${type === "bug" ? "Bug Report" : type === "feature" ? "Feature Request" : "Feedback"}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-gray-300 px-6 py-3 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
