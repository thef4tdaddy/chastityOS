import React, { memo, useMemo } from "react";
import { FaEdit, FaLock, FaUnlock } from "../../utils/iconImport";
import { Button } from "@/components/ui";

// Mock rules interface
export interface ChastityRule {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdBy: "submissive" | "keyholder";
  createdAt: Date;
  lastModified: Date;
}

// Helper function for markdown formatting
const formatMarkdownToReact = (content: string) => {
  // Simple markdown-to-HTML conversion (in real app, use a proper library)
  return content.split("\n").map((line, index) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <strong key={index} className="text-nightly-honeydew">
          {line.slice(2, -2)}
        </strong>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={index} className="ml-4 text-nightly-celadon">
          {line.slice(2)}
        </li>
      );
    }
    if (line.trim() === "") {
      return <br key={index} />;
    }
    return (
      <p key={index} className="text-nightly-celadon mb-2">
        {line}
      </p>
    );
  });
};

// Rule Card Component
interface RuleCardProps {
  rule: ChastityRule;
  isEditable: boolean;
  onEdit?: (ruleId: string) => void;
  onToggle?: (ruleId: string) => void;
}

const RuleCardComponent: React.FC<RuleCardProps> = ({
  rule,
  isEditable,
  onEdit,
  onToggle,
}) => {
  // Memoize formatted content to avoid recalculation
  const formattedContent = useMemo(
    () => formatMarkdownToReact(rule.content),
    [rule.content],
  );

  // Memoize formatted date to avoid recalculation
  const formattedDate = useMemo(
    () => rule.lastModified.toLocaleDateString(),
    [rule.lastModified],
  );

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {rule.isActive ? (
              <FaUnlock className="text-green-400" />
            ) : (
              <FaLock className="text-gray-400" />
            )}
            <h3 className="text-lg font-semibold text-nightly-honeydew">
              {rule.title}
            </h3>
            <span
              className={`px-2 py-1 text-xs rounded ${
                rule.isActive
                  ? "bg-green-500/20 text-green-300"
                  : "bg-gray-500/20 text-gray-300"
              }`}
            >
              {rule.isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-nightly-celadon">
            <span>Created by: {rule.createdBy}</span>
            <span>•</span>
            <span>Modified: {formattedDate}</span>
          </div>
        </div>

        {isEditable && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onToggle?.(rule.id)}
              className={`p-2 rounded transition-colors ${
                rule.isActive
                  ? "bg-gray-500/20 hover:bg-gray-500/30 text-gray-300"
                  : "bg-green-500/20 hover:bg-green-500/30 text-green-300"
              }`}
              title={rule.isActive ? "Deactivate rule" : "Activate rule"}
            >
              {rule.isActive ? <FaLock /> : <FaUnlock />}
            </Button>
            <Button
              onClick={() => onEdit?.(rule.id)}
              className="p-2 bg-nightly-aquamarine/20 hover:bg-nightly-aquamarine/30 text-nightly-aquamarine rounded transition-colors"
              title="Edit rule"
            >
              <FaEdit />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none">{formattedContent}</div>
    </div>
  );
};

// Memoize RuleCard to prevent unnecessary re-renders
export const RuleCard = memo(RuleCardComponent);
