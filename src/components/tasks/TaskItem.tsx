import React, { memo, useState } from "react";
import { motion } from "framer-motion";
import type { DBTask } from "../../types/database";
import { CountdownTimer } from "./CountdownTimer";
import { RecurringTaskBadge } from "./RecurringTaskBadge";
import { TaskEvidenceDisplay } from "./TaskEvidenceDisplay";
import { TaskEvidenceUpload } from "./TaskEvidenceUpload";
import { FaTrophy, FaGavel } from "../../utils/iconImport";
import { useTaskItem } from "../../hooks/tasks/useTaskItem";
import { Textarea } from "@/components/ui";
import {
  taskCardVariants,
  buttonVariants,
  statusBadgeVariants,
  celebrationVariants,
} from "../../utils/animations";

// Task status badge component
interface TaskStatusBadgeProps {
  statusConfig: {
    icon: React.ReactNode;
    text: string;
    borderColor: string;
  };
  priority?: string;
  priorityStyles?: {
    bgColor: string;
    textColor: string;
  } | null;
}

const TaskStatusBadgeComponent: React.FC<TaskStatusBadgeProps> = ({
  statusConfig,
  priority,
  priorityStyles,
}) => (
  <motion.div
    className="flex items-center gap-2"
    initial="initial"
    animate="animate"
    variants={statusBadgeVariants}
  >
    {statusConfig.icon}
    <span className="text-sm font-medium text-nightly-spring-green">
      {statusConfig.text}
    </span>
    {priority && priorityStyles && (
      <span
        className={`px-2 py-1 text-xs rounded ${priorityStyles.bgColor} ${priorityStyles.textColor}`}
      >
        {priority.toUpperCase()}
      </span>
    )}
  </motion.div>
);

// Memoize TaskStatusBadge
const TaskStatusBadge = memo(TaskStatusBadgeComponent);

// Task countdown component
interface TaskCountdownProps {
  dueDate: Date;
  isOverdue: boolean;
}

const TaskCountdownComponent: React.FC<TaskCountdownProps> = ({
  dueDate,
  isOverdue,
}) => (
  <div className="text-right">
    <div className="text-xs text-nightly-celadon">Due in:</div>
    <CountdownTimer deadline={dueDate} />
    {isOverdue && <div className="text-xs text-red-400 mt-1">OVERDUE</div>}
  </div>
);

// Memoize TaskCountdown
const TaskCountdown = memo(TaskCountdownComponent);

// Task content component
interface TaskContentProps {
  text: string;
  description?: string;
}

const TaskContentComponent: React.FC<TaskContentProps> = ({
  text,
  description,
}) => (
  <div className="mb-3">
    <h3 className="text-lg font-semibold text-nightly-honeydew mb-2">{text}</h3>
    {description && (
      <p className="text-nightly-celadon text-sm mb-2">{description}</p>
    )}
  </div>
);

// Memoize TaskContent
const TaskContent = memo(TaskContentComponent);

// Task metadata component
interface TaskMetadataProps {
  createdAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
}

const TaskMetadataComponent: React.FC<TaskMetadataProps> = ({
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

// Memoize TaskMetadata
const TaskMetadata = memo(TaskMetadataComponent);

// Task feedback component
interface TaskFeedbackProps {
  feedback: string;
}

const TaskFeedbackComponent: React.FC<TaskFeedbackProps> = ({ feedback }) => (
  <div className="bg-nightly-lavender-floral/10 border border-nightly-lavender-floral/20 rounded p-2 mb-3">
    <div className="text-xs text-nightly-lavender-floral mb-1">
      Keyholder Feedback:
    </div>
    <div className="text-sm text-nightly-honeydew">{feedback}</div>
  </div>
);

// Memoize TaskFeedback
const TaskFeedback = memo(TaskFeedbackComponent);

// Task consequence component
interface TaskConsequenceProps {
  consequence: {
    type: "reward" | "punishment";
    description: string;
    duration?: number;
  };
}

const TaskConsequenceComponent: React.FC<TaskConsequenceProps> = ({
  consequence,
}) => {
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

// Memoize TaskConsequence
const TaskConsequence = memo(TaskConsequenceComponent);

// Task submission component
interface TaskSubmissionProps {
  taskId: string;
  userId: string;
  note: string;
  isSubmitting: boolean;
  onNoteChange: (note: string) => void;
  onAttachmentsChange: (attachments: string[]) => void;
  onSubmit: () => void;
}

const TaskSubmission: React.FC<TaskSubmissionProps> = ({
  taskId,
  userId,
  note,
  isSubmitting,
  onNoteChange,
  onAttachmentsChange,
  onSubmit,
}) => {
  return (
    <div className="border-t border-white/10 pt-3">
      <Textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Add submission notes (optional)..."
        className="w-full bg-white/5 border border-white/10 rounded p-2 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none mb-3"
        rows={3}
      />

      <div className="mb-3">
        <div className="text-sm text-nightly-celadon mb-2">
          Upload Evidence (optional):
        </div>
        <TaskEvidenceUpload
          taskId={taskId}
          userId={userId}
          onUploadComplete={onAttachmentsChange}
          maxFiles={5}
        />
      </div>

      <motion.button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full mt-2 bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
        variants={buttonVariants}
        whileHover={!isSubmitting ? "hover" : undefined}
        whileTap={!isSubmitting ? "tap" : undefined}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            Submitting...
          </span>
        ) : (
          "Submit for Review"
        )}
      </motion.button>
    </div>
  );
};

// Task item component
interface TaskItemProps {
  task: DBTask;
  onSubmit: (taskId: string, note: string, attachments?: string[]) => void;
  userId?: string;
}

const TaskItemComponent: React.FC<TaskItemProps> = ({
  task,
  onSubmit,
  userId = "",
}) => {
  const {
    note,
    isSubmitting,
    setNote,
    setAttachments,
    handleSubmit,
    statusConfig,
    priorityStyles,
    isOverdue,
  } = useTaskItem(task, onSubmit);

  const [showCelebration, setShowCelebration] = useState(false);

  // Show celebration effect when task is approved
  React.useEffect(() => {
    if (task.status === "approved" && task.consequence?.type === "reward") {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [task.status, task.consequence]);

  return (
    <motion.div
      className={`bg-white/10 backdrop-blur-sm border-l-4 ${statusConfig.borderColor} rounded-lg p-4 mb-4 relative`}
      variants={taskCardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={task.status === "pending" ? "hover" : undefined}
      layout
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <TaskStatusBadge
          statusConfig={statusConfig}
          priority={task.priority}
          priorityStyles={priorityStyles}
        />
        {task.dueDate && (
          <TaskCountdown dueDate={task.dueDate} isOverdue={isOverdue} />
        )}
      </div>

      <TaskContent text={task.text} description={task.description} />

      {task.isRecurring && (
        <div className="mb-3">
          <RecurringTaskBadge task={task} />
        </div>
      )}

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

      {/* Display evidence if submitted/approved/rejected */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="mb-3">
          <TaskEvidenceDisplay attachments={task.attachments} />
        </div>
      )}

      {task.status === "pending" && (
        <TaskSubmission
          taskId={task.id}
          userId={userId || task.userId}
          note={note}
          isSubmitting={isSubmitting}
          onNoteChange={setNote}
          onAttachmentsChange={setAttachments}
          onSubmit={handleSubmit}
        />
      )}

      {/* Celebration overlay for approved tasks */}
      {showCelebration && task.consequence?.type === "reward" && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-lg pointer-events-none"
          variants={celebrationVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-6xl">🎉</div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Memoize TaskItem to prevent unnecessary re-renders
export const TaskItem = memo(TaskItemComponent);
