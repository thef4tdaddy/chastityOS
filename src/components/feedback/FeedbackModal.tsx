// src/components/feedback/FeedbackModal.tsx

import React, { useState } from "react";
import {
  FaBug,
  FaLightbulb,
  FaComment,
  FaTimes,
  FaPaperPlane,
} from "../../utils/iconImport";
import type {
  FeedbackModalProps,
  FeedbackData,
  FeedbackType,
} from "../../types/feedback";
import { collectSystemInfo } from "../../utils/systemInfo";
import { logger } from "../../utils/logging";
import {
  Input,
  Textarea,
  Select,
  SelectOption,
  Button,
  Switch,
} from "@/components/ui";

// Form field components
interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  required,
}) => (
  <Input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    placeholder={placeholder}
    required={required}
    disabled={disabled}
  />
);

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
  required,
}) => (
  <Textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
    rows={rows}
    placeholder={placeholder}
    required={required}
    disabled={disabled}
  />
);

// Priority selector component
interface PrioritySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const priorityOptions: SelectOption[] = [
  { value: "low", label: "Low - Minor inconvenience" },
  { value: "medium", label: "Medium - Affects functionality" },
  { value: "high", label: "High - Prevents core features" },
];

const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  disabled,
}) => (
  <Select
    value={value}
    onChange={(val) => onChange(val as string)}
    options={priorityOptions}
    disabled={disabled}
  />
);

// Bug-specific fields component
interface BugFieldsProps {
  formData: {
    steps: string;
    expected: string;
    actual: string;
    priority: string;
  };
  onUpdateField: (field: string, value: string) => void;
  disabled: boolean;
}

const BugFields: React.FC<BugFieldsProps> = ({
  formData,
  onUpdateField,
  disabled,
}) => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Steps to Reproduce">
        <TextArea
          value={formData.steps}
          onChange={(value) => onUpdateField("steps", value)}
          placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
          rows={3}
          disabled={disabled}
        />
      </FormField>

      <FormField label="Priority">
        <PrioritySelector
          value={formData.priority}
          onChange={(value) => onUpdateField("priority", value)}
          disabled={disabled}
        />
      </FormField>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Expected Behavior">
        <TextArea
          value={formData.expected}
          onChange={(value) => onUpdateField("expected", value)}
          placeholder="What should have happened?"
          rows={2}
          disabled={disabled}
        />
      </FormField>

      <FormField label="Actual Behavior">
        <TextArea
          value={formData.actual}
          onChange={(value) => onUpdateField("actual", value)}
          placeholder="What actually happened?"
          rows={2}
          disabled={disabled}
        />
      </FormField>
    </div>
  </>
);

// Helper functions extracted from main component
const getModalTitle = (type: FeedbackType): string => {
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

const getModalIcon = (type: FeedbackType): React.ReactElement => {
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

const getTitlePlaceholder = (type: FeedbackType): string => {
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

const getDescriptionPlaceholder = (type: FeedbackType): string => {
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

const getTitleLabel = (type: FeedbackType): string => {
  switch (type) {
    case "bug":
      return "Bug Summary";
    case "feature":
      return "Feature Title";
    default:
      return "Feedback Title";
  }
};

// Form content component
interface FeedbackFormProps {
  type: FeedbackType;
  formData: {
    title: string;
    description: string;
    steps: string;
    expected: string;
    actual: string;
    priority: string;
    contactEmail: string;
    includeSystemInfo: boolean;
  };
  updateField: (field: string, value: string | boolean | File | null) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

// Form actions component (toggle and buttons)
interface FormActionsProps {
  type: FeedbackType;
  formData: { includeSystemInfo: boolean };
  updateField: (field: string, value: boolean | File | null) => void;
  isSubmitting: boolean;
  onClose: () => void;
}

const FormActions: React.FC<FormActionsProps> = ({
  type,
  formData,
  updateField,
  isSubmitting,
  onClose,
}) => (
  <>
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
      <Switch
        checked={formData.includeSystemInfo}
        onCheckedChange={(checked) => updateField("includeSystemInfo", checked)}
        disabled={isSubmitting}
      />
    </div>

    {/* Submit Buttons */}
    <div className="flex gap-3 pt-4">
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-6 py-3 rounded font-medium transition-colors flex items-center gap-2"
      >
        <FaPaperPlane />
        {getSubmitButtonText(type, isSubmitting)}
      </Button>
      <Button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-gray-300 px-6 py-3 rounded font-medium transition-colors"
      >
        Cancel
      </Button>
    </div>
  </>
);

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  type,
  formData,
  updateField,
  isSubmitting,
  onSubmit,
  onClose,
}) => (
  <form
    onSubmit={onSubmit}
    className="p-6 overflow-y-auto max-h-[70vh] space-y-4"
  >
    {/* Title */}
    <FormField label={getTitleLabel(type)} required>
      <TextInput
        value={formData.title}
        onChange={(value) => updateField("title", value)}
        placeholder={getTitlePlaceholder(type)}
        disabled={isSubmitting}
        required
      />
    </FormField>

    {/* Description */}
    <FormField label="Description" required>
      <TextArea
        value={formData.description}
        onChange={(value) => updateField("description", value)}
        placeholder={getDescriptionPlaceholder(type)}
        disabled={isSubmitting}
        required
      />
    </FormField>

    {/* Bug-specific fields */}
    {type === "bug" && (
      <BugFields
        formData={formData}
        onUpdateField={updateField}
        disabled={isSubmitting}
      />
    )}

    {/* Screenshot Upload */}
    <FormField label="Screenshot (Optional)">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => updateField("screenshot", e.target.files?.[0] || null)}
        className="w-full bg-white/5 border border-white/10 rounded p-3 text-white file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
        disabled={isSubmitting}
      />
    </FormField>

    {/* Contact Email */}
    <FormField label="Contact Email (Optional)">
      <Input
        type="email"
        value={formData.contactEmail}
        onChange={(e) => updateField("contactEmail", e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="your@email.com (if you want updates)"
        disabled={isSubmitting}
      />
    </FormField>

    <FormActions
      type={type}
      formData={formData}
      updateField={updateField}
      isSubmitting={isSubmitting}
      onClose={onClose}
    />
  </form>
);

const getSubmitButtonText = (
  type: FeedbackType,
  isSubmitting: boolean,
): string => {
  if (isSubmitting) return "Submitting...";

  switch (type) {
    case "bug":
      return "Submit Bug Report";
    case "feature":
      return "Submit Feature Request";
    default:
      return "Submit Feedback";
  }
};

// Modal Header Component
interface ModalHeaderProps {
  type: FeedbackType;
  onClose: () => void;
  isSubmitting: boolean;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  type,
  onClose,
  isSubmitting,
}) => (
  <div className="flex items-center justify-between p-6 border-b border-gray-600">
    <div className="flex items-center gap-3">
      {getModalIcon(type)}
      <h2 className="text-xl font-bold text-white">{getModalTitle(type)}</h2>
    </div>
    <Button
      onClick={onClose}
      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
      disabled={isSubmitting}
    >
      <FaTimes className="text-gray-400" />
    </Button>
  </div>
);

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

  const updateField = (
    field: string,
    value: string | boolean | File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
      logger.error("Failed to submit feedback", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 max-w-2xl w-full max-h-[90vh] rounded-lg border border-gray-600 overflow-hidden">
        <ModalHeader
          type={type}
          onClose={onClose}
          isSubmitting={isSubmitting}
        />
        <FeedbackForm
          type={type}
          formData={formData}
          updateField={updateField}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default FeedbackModal;
