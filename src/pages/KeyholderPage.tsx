import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "../contexts";
import { useKeyholderStore } from "../stores/keyholderStore";
import { sessionDBService, taskDBService } from "../services/database";
import type { DBSession, DBTask, TaskStatus } from "../types/database";
import { logger } from "../utils/logging";
import {
  FaArrowLeft,
  FaLock,
  FaUnlock,
  FaKey,
  FaUsers,
  FaCog,
  FaTasks,
  FaClock,
  FaPlay,
  FaStop,
  FaPause,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaEye,
  FaLink,
  FaUserShield,
  FaSpinner,
  FaQrcode,
  FaClipboard,
} from "react-icons/fa";

// Password Unlock Component
const KeyholderPasswordUnlock: React.FC = () => {
  const {
    isKeyholderModeUnlocked,
    isPasswordDialogOpen,
    passwordAttempt,
    keyholderMessage,
    isCheckingPassword,
    openPasswordDialog,
    setPasswordAttempt,
    checkPassword,
    clearMessage,
  } = useKeyholderStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordAttempt.trim()) return;

    // For demo - in real app this would come from settings
    const storedHash = "demo_password_hash"; // This would be from user settings
    await checkPassword(passwordAttempt, storedHash);
  };

  if (isKeyholderModeUnlocked) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <FaUnlock className="text-green-400" />
          <span className="text-green-400 font-medium">
            Keyholder Controls Unlocked
          </span>
        </div>
        <p className="text-nightly-celadon text-sm mt-2">
          You have temporary admin access to this account's chastity controls.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <FaLock className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Temporary Keyholder Access
        </h2>
      </div>

      <p className="text-nightly-celadon mb-4">
        This is the current temporary password-based keyholder system. In the
        future, this will be replaced with secure account linking.
      </p>

      {!isPasswordDialogOpen ? (
        <button
          onClick={openPasswordDialog}
          className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
        >
          <FaKey />
          Unlock Keyholder Controls
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Keyholder Password
            </label>
            <input
              type="password"
              value={passwordAttempt}
              onChange={(e) => setPasswordAttempt(e.target.value)}
              placeholder="Enter keyholder password"
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
              disabled={isCheckingPassword}
            />
          </div>

          {keyholderMessage && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              <p className="text-yellow-300 text-sm">{keyholderMessage}</p>
              <button
                type="button"
                onClick={clearMessage}
                className="text-yellow-400 hover:text-yellow-300 text-sm mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isCheckingPassword || !passwordAttempt.trim()}
            className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
          >
            {isCheckingPassword ? (
              <>
                <FaSpinner className="animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <FaUnlock />
                Unlock
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

// Future Account Linking Preview Component
const AccountLinkingPreview: React.FC = () => {
  const [showLinkingDemo, setShowLinkingDemo] = useState(false);
  const [linkCode] = useState("CHY-X9K2-P7M4"); // Demo code

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <FaUserShield className="text-nightly-lavender-floral" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Account Linking (Coming Soon)
        </h2>
        <span className="bg-nightly-lavender-floral/20 text-nightly-lavender-floral px-2 py-1 text-xs rounded">
          PREVIEW
        </span>
      </div>

      <p className="text-nightly-celadon mb-4">
        The future keyholder system will use secure account linking instead of
        shared passwords. This provides better security and proper multi-user
        support.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium text-nightly-honeydew mb-2 flex items-center gap-2">
              <FaLink className="text-nightly-aquamarine" />
              For Submissives
            </h3>
            <ul className="text-sm text-nightly-celadon space-y-1">
              <li>• Generate secure link codes</li>
              <li>• Share privately with keyholder</li>
              <li>• Maintain ultimate control</li>
              <li>• Disconnect anytime</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium text-nightly-honeydew mb-2 flex items-center gap-2">
              <FaUsers className="text-nightly-lavender-floral" />
              For Keyholders
            </h3>
            <ul className="text-sm text-nightly-celadon space-y-1">
              <li>• Full admin dashboard access</li>
              <li>• Manage multiple submissives</li>
              <li>• Real-time control & monitoring</li>
              <li>• Audit trail of all actions</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setShowLinkingDemo(!showLinkingDemo)}
          className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded font-medium transition-colors"
        >
          {showLinkingDemo ? "Hide Demo" : "Preview Linking Process"}
        </button>

        {showLinkingDemo && (
          <div className="bg-white/5 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-nightly-honeydew">
              Demo: Link Code Generation
            </h4>

            <div className="bg-black/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-nightly-celadon text-sm">
                  Your Link Code:
                </span>
                <span className="text-xs text-nightly-celadon">
                  Expires in 23h 45m
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <code className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-3 py-2 rounded font-mono text-lg">
                  {linkCode}
                </code>
                <button className="text-nightly-aquamarine hover:text-nightly-spring-green">
                  <FaClipboard />
                </button>
              </div>

              <div className="flex gap-2">
                <button className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-3 py-1 rounded text-sm flex items-center gap-2">
                  <FaQrcode />
                  QR Code
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-3 py-1 rounded text-sm">
                  Share URL
                </button>
              </div>
            </div>

            <div className="text-sm text-nightly-celadon">
              <p className="mb-2">
                <strong>Secure Sharing:</strong> Share this code privately with
                your keyholder via text, voice, QR code, or encrypted email.
              </p>
              <p>
                <strong>One-Time Use:</strong> Code expires in 24 hours or after
                first use. You can disconnect the keyholder anytime.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Current Session Control (for unlocked keyholder mode)
const SessionControls: React.FC<{ session: DBSession | null }> = ({
  session,
}) => {
  if (!session) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaClock className="text-nightly-aquamarine" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">
            Session Control
          </h3>
        </div>
        <p className="text-nightly-celadon">No active session to control.</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaClock className="text-nightly-aquamarine" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Session Control
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Status:</span>
          <div className="flex items-center gap-2">
            {session.isPaused ? (
              <>
                <FaPause className="text-yellow-400" />
                <span className="text-yellow-400">Paused</span>
              </>
            ) : (
              <>
                <FaPlay className="text-green-400" />
                <span className="text-green-400">Active</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Started:</span>
          <span className="text-nightly-honeydew">
            {session.startTime.toLocaleDateString()}{" "}
            {session.startTime.toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-nightly-celadon">Pause Time:</span>
          <span className="text-nightly-honeydew">
            {formatDuration(session.accumulatedPauseTime)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            disabled={session.isPaused}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FaPause />
            Pause Session
          </button>

          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2">
            <FaStop />
            End Session
          </button>
        </div>
      </div>
    </div>
  );
};

// Task Management for Keyholder
const TaskManagement: React.FC<{ tasks: DBTask[] }> = ({ tasks }) => {
  const [newTaskText, setNewTaskText] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const pendingTasks = tasks.filter((t) =>
    ["pending", "submitted"].includes(t.status),
  );

  const handleTaskAction = async (
    taskId: string,
    action: "approve" | "reject",
    feedback?: string,
  ) => {
    try {
      const newStatus: TaskStatus =
        action === "approve" ? "approved" : "rejected";
      await taskDBService.updateTaskStatus(taskId, newStatus, feedback);
      // In real app, this would refresh the tasks
    } catch (error) {
      logger.error("Error updating task:", error, "KeyholderPage");
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaTasks className="text-nightly-lavender-floral" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">
            Task Management
          </h3>
        </div>
        <button
          onClick={() => setShowAddTask(!showAddTask)}
          className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <FaPlus />
          Add Task
        </button>
      </div>

      {showAddTask && (
        <div className="mb-6 bg-white/5 rounded-lg p-4">
          <h4 className="font-medium text-nightly-honeydew mb-3">
            Create New Task
          </h4>
          <div className="space-y-3">
            <textarea
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Task description..."
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // In real app, would call taskDBService.create
                  setNewTaskText("");
                  setShowAddTask(false);
                }}
                disabled={!newTaskText.trim()}
                className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-4 py-2 rounded font-medium transition-colors"
              >
                Create Task
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-4 py-2 rounded font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pendingTasks.length === 0 ? (
          <p className="text-nightly-celadon">No pending tasks</p>
        ) : (
          pendingTasks.map((task) => (
            <div key={task.id} className="bg-white/5 rounded-lg p-4">
              <div className="mb-3">
                <h4 className="font-medium text-nightly-honeydew mb-1">
                  {task.text}
                </h4>
                <div className="flex items-center gap-2 text-sm text-nightly-celadon">
                  <span>Status: {task.status}</span>
                  <span>•</span>
                  <span>Priority: {task.priority}</span>
                  {task.dueDate && (
                    <>
                      <span>•</span>
                      <span>Due: {task.dueDate.toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              {task.submissiveNote && (
                <div className="bg-white/5 rounded p-2 mb-3">
                  <div className="text-xs text-nightly-celadon mb-1">
                    Submissive Note:
                  </div>
                  <div className="text-sm text-nightly-honeydew">
                    {task.submissiveNote}
                  </div>
                </div>
              )}

              {task.status === "submitted" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTaskAction(task.id, "approve")}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <FaCheckCircle />
                    Approve
                  </button>
                  <button
                    onClick={() => handleTaskAction(task.id, "reject")}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <FaTimesCircle />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const KeyholderPage: React.FC = () => {
  const { user } = useAuthState();
  const { isKeyholderModeUnlocked, lockKeyholderControls } =
    useKeyholderStore();
  const [currentSession, setCurrentSession] = useState<DBSession | null>(null);
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [session, userTasks] = await Promise.all([
          sessionDBService.getCurrentSession(user.uid),
          taskDBService.findByUserId(user.uid),
        ]);

        setCurrentSession(session || null);
        setTasks(userTasks);
      } catch (error) {
        logger.error("Error fetching keyholder data:", error, "KeyholderPage");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Auto-lock when leaving page
  useEffect(() => {
    return () => {
      if (isKeyholderModeUnlocked) {
        lockKeyholderControls();
      }
    };
  }, [isKeyholderModeUnlocked, lockKeyholderControls]);

  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-nightly-aquamarine hover:text-nightly-spring-green"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Keyholder Access</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
            <div className="text-nightly-celadon">
              Loading keyholder controls...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Linking Preview - Always visible */}
            <AccountLinkingPreview />

            {/* Current Password System */}
            <KeyholderPasswordUnlock />

            {/* Keyholder Controls - Only when unlocked */}
            {isKeyholderModeUnlocked && (
              <>
                <SessionControls session={currentSession} />
                <TaskManagement tasks={tasks} />

                {/* Additional Controls */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FaCog className="text-nightly-spring-green" />
                    <h3 className="text-lg font-semibold text-nightly-honeydew">
                      Keyholder Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="bg-white/5 hover:bg-white/10 p-4 rounded-lg text-left transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <FaEye className="text-nightly-aquamarine" />
                        <span className="font-medium text-nightly-honeydew">
                          View Full Report
                        </span>
                      </div>
                      <p className="text-sm text-nightly-celadon">
                        See complete session history and statistics
                      </p>
                    </button>

                    <button className="bg-white/5 hover:bg-white/10 p-4 rounded-lg text-left transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <FaCog className="text-nightly-lavender-floral" />
                        <span className="font-medium text-nightly-honeydew">
                          Manage Rules
                        </span>
                      </div>
                      <p className="text-sm text-nightly-celadon">
                        Set requirements and restrictions
                      </p>
                    </button>
                  </div>

                  <button
                    onClick={lockKeyholderControls}
                    className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                  >
                    <FaLock />
                    Lock Controls
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyholderPage;
