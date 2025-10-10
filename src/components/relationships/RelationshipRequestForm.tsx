import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { Input, Textarea } from "@/components/ui";

interface RelationshipRequestFormProps {
  isVisible: boolean;
  isLoading: boolean;
  onSubmit: (data: {
    email: string;
    role: "submissive" | "keyholder";
    message: string;
  }) => void;
  onCancel: () => void;
}

// Form Fields Components
interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const EmailField: React.FC<EmailFieldProps> = ({ value, onChange }) => (
  <div>
    <label
      htmlFor="email"
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      Email Address
    </label>
    <Input
      type="email"
      id="email"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      placeholder="person@example.com"
      required
    />
  </div>
);

interface RoleFieldProps {
  value: "submissive" | "keyholder";
  onChange: (value: "submissive" | "keyholder") => void;
}

const RoleField: React.FC<RoleFieldProps> = ({ value, onChange }) => (
  <div>
    <label
      htmlFor="role"
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      Your Role in this Relationship
    </label>
    <select
      id="role"
      value={value}
      onChange={(e) => onChange(e.target.value as "submissive" | "keyholder")}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="submissive">Submissive</option>
      <option value="keyholder">Keyholder</option>
    </select>
  </div>
);

interface MessageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const MessageField: React.FC<MessageFieldProps> = ({ value, onChange }) => (
  <div>
    <label
      htmlFor="message"
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      Message (Optional)
    </label>
    <Textarea
      id="message"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      placeholder="Add a personal message..."
    />
  </div>
);

export const RelationshipRequestForm: React.FC<
  RelationshipRequestFormProps
> = ({ isVisible, isLoading, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    email: "",
    role: "submissive" as "submissive" | "keyholder",
    message: "",
  });

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Send Relationship Request
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <EmailField
          value={formData.email}
          onChange={(email) => setFormData({ ...formData, email })}
        />
        <RoleField
          value={formData.role}
          onChange={(role) => setFormData({ ...formData, role })}
        />
        <MessageField
          value={formData.message}
          onChange={(message) => setFormData({ ...formData, message })}
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Sending...
              </>
            ) : (
              "Send Request"
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
