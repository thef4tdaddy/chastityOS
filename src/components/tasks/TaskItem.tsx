import React, { useState } from "react";
import type { DBTask, TaskStatus } from "../../types/database";
import { CountdownTimer } from "./CountdownTimer";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaGavel,
  FaClock,
} from "../../utils/iconImport";

// Helper function to get task status configuration
const getTaskStatusConfig = (status: TaskStatus) => {
  switch (status) {
    case "pending":
      return {
        icon: <FaClock className="text-nightly-aquamarine" />,
        text: "Pending",
        borderColor: "border-nightly-aquamarine",
      };
    case "submitted":
      return {
        icon: <FaClock className="text-yellow-400" />,
        text: "Submitted",
        borderColor: "border-yellow-400",
      };
    case "approved":
      return {
        icon: <FaCheckCircle className="text-green-400" />,
        text: "Approved",
        borderColor: "border-green-400",
      };
    case "rejected":
      return {
        icon: <FaTimesCircle className="text-red-400" />,
        text: "Rejected",
        borderColor: "border-red-400",
      };
    case "completed":
      return {
        icon: <FaTrophy className="text-nightly-lavender-floral" />,
        text: "Completed",
        borderColor: "border-nightly-lavender-floral",
      };
    default:
      return {
        icon: <FaClock className="text-gray-400" />,
        text: "Unknown",
        borderColor: "border-gray-400",
      };
  }
};

// Helper function to get priority styling
const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case "critical":
      return "bg-red-500/20 text-red-300";
    case "high":
      return "bg-orange-500/20 text-orange-300";
    case "medium":
      return "bg-yellow-500/20 text-yellow-300";
    default:
      return "bg-gray-500/20 text-gray-300";
  }
};

// Task status badge component
interface TaskStatusBadgeProps {
  status: TaskStatus;
  priority?: string;
}

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  priority,
}) => {
  const statusConfig = getTaskStatusConfig(status);

  return (
    <div className="flex items-center gap-2">
      {statusConfig.icon}
      <span className="text-sm font-medium text-nightly-spring-green">
        {statusConfig.text}
      </span>
      {priority && (
        <span
          className={`px-2 py-1 text-xs rounded ${getPriorityStyles(priority)}`}
        >
          {priority.toUpperCase()}
        </span>
      )}
    </div>
  );
};

// Task countdown component
interface TaskCountdownProps {
  dueDate: Date;
  isOverdue: boolean;
}

const TaskCountdown: React.FC<TaskCountdownProps> = ({
  dueDate,
  isOverdue,
}) => (
  <div className="text-right">
    <div className="text-xs text-nightly-celadon">Due in:</div>
    <CountdownTimer deadline={dueDate} />
    {isOverdue && <div className="text-xs text-red-400 mt-1">OVERDUE</div>}
  </div>
);

// Task content component
interface TaskContentProps {
  text: string;
  description?: string;
}

const TaskContent: React.FC<TaskContentProps> = ({ text, description }) => (
  <div className="mb-3">
    <h3 className="text-lg font-semibold text-nightly-honeydew mb-2">{text}</h3>
    {description && (
      <p className="text-nightly-celadon text-sm mb-2">{description}</p>
    )}
  </div>
);

// Task metadata component
interface TaskMetadataProps {
  createdAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
}

const TaskMetadata: React.FC<TaskMetadataProps> = ({
  createdAt,
  submittedAt,
  approvedAt,
}) => (
  <div className="flex gap-4 text-xs text-nightly-celadon mb-3">
    <span>Created: {createdAt.toLocaleDateString()}</span>
    {submittedAt && <span>Submitted: {submittedAt.toLocaleDateString()}</span>}
    {approvedAt && <span>Approved: {approvedAt.toLocaleDateString()}</span>}
  </div>
);

// Task feedback component
interface TaskFeedbackProps {
  feedback: string;
}

const TaskFeedback: React.FC<TaskFeedbackProps> = ({ feedback }) => (
  <div className="bg-nightly-lavender-floral/10 border border-nightly-lavender-floral/20 rounded p-2 mb-3">
    <div className="text-xs text-nightly-lavender-floral mb-1">
      Keyholder Feedback:
    </div>
    <div className="text-sm text-nightly-honeydew">{feedback}</div>
  </div>
);

// Task consequence component
interface TaskConsequenceProps {
  consequence: {
    type: "reward" | "punishment";
    description: string;
    duration?: number;
  };
}

const TaskConsequence: React.FC<TaskConsequenceProps> = ({ consequence }) => {
  const isReward = consequence.type === "reward";

  return (
    <div
      className={`rounded p-2 mb-3 ${
        isReward
          ? "bg-green-500/10 border border-green-500/20"
          : "bg-red-500/10 border border-red-500/20"
      }`}
    >
      <div className="flex items-center gap-2">
        {isReward ? (
          <FaTrophy className="text-green-400" />
        ) : (
          <FaGavel className="text-red-400" />
        )}
        <span
          className={`text-xs font-medium ${
            isReward ? "text-green-400" : "text-red-400"
          }`}
        >
          {consequence.type.toUpperCase()}
        </span>
      </div>
      <div className="text-sm text-nightly-honeydew mt-1">
        {consequence.description}
      </div>
      {consequence.duration && (
        <div className="text-xs text-nightly-celadon mt-1">
          Duration: {Math.abs(consequence.duration)} seconds{" "}
          {consequence.duration > 0 ? "added" : "reduced"}
        </div>
      )}
    </div>
  );
};

// Task submission component
interface TaskSubmissionProps {
  note: string;
  isSubmitting: boolean;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
}

const TaskSubmission: React.FC<TaskSubmissionProps> = ({
  note,
  isSubmitting,
  onNoteChange,
  onSubmit,
}) => (
  <div className="border-t border-white/10 pt-3">
    <textarea
      value={note}
      onChange={(e) => onNoteChange(e.target.value)}
      placeholder="Add submission notes (optional)..."
      className="w-full bg-white/5 border border-white/10 rounded p-2 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
      rows={3}
    />
    <button
      onClick={onSubmit}
      disabled={isSubmitting}
      className="mt-2 bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
    >
      {isSubmitting ? "Submitting..." : "Submit for Review"}
    </button>
  </div>
);

// Task item component
interface TaskItemProps {
  task: DBTask;
  onSubmit: (taskId: string, note: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onSubmit }) => {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(task.id, note);
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = getTaskStatusConfig(task.status);
  const isOverdue = task.dueDate && new Date() > task.dueDate;

  return (
    <div
      className={`bg-white/10 backdrop-blur-sm border-l-4 ${statusConfig.borderColor} rounded-lg p-4 mb-4`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <TaskStatusBadge status={task.status} priority={task.priority} />
        {task.dueDate && (
          <TaskCountdown
            dueDate={task.dueDate}
            isOverdue={Boolean(isOverdue)}
          />
        )}
      </div>

      <TaskContent text={task.text} description={task.description} />

      <TaskMetadata
        createdAt={task.createdAt}
        submittedAt={task.submittedAt}
        approvedAt={task.approvedAt}
      />

      {task.keyholderFeedback && (
        <TaskFeedback feedback={task.keyholderFeedback} />
      )}

      {task.consequence && task.consequence.description && (
        <TaskConsequence
          consequence={{
            ...task.consequence,
            description: task.consequence.description,
          }}
        />
      )}

      {task.status === "pending" && (
        <TaskSubmission
          note={note}
          isSubmitting={isSubmitting}
          onNoteChange={setNote}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};
