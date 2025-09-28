import React, { useState, useEffect } from "react";
import { FaPlay, FaStop, FaPause, FaSync, FaTrash } from "react-icons/fa";

// Type definitions
interface DemoSession {
  id: string;
  startTime: string;
  isPaused: boolean;
}

interface BackupState {
  sessionId: string;
  startTime: string;
  lastHeartbeat: string;
  duration: number;
}

// Sub-components
const DemoControls: React.FC<{
  demoSession: DemoSession | null;
  backupState: BackupState | null;
  isHeartbeatActive: boolean;
  onStartSession: () => void;
  onStopSession: () => void;
  onPauseHeartbeat: () => void;
  onResumeHeartbeat: () => void;
  onRestoreBackup: () => void;
  onClearAll: () => void;
}> = ({
  demoSession,
  backupState,
  isHeartbeatActive,
  onStartSession,
  onStopSession,
  onPauseHeartbeat,
  onResumeHeartbeat,
  onRestoreBackup,
  onClearAll,
}) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-green-300">Controls</h3>
    <div className="grid grid-cols-2 gap-2 mb-4">
      <button
        onClick={onStartSession}
        disabled={!!demoSession}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
      >
        <FaPlay className="mr-2" />
        Start Session
      </button>
      <button
        onClick={onStopSession}
        disabled={!demoSession}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
      >
        <FaStop className="mr-2" />
        Stop Session
      </button>
      <button
        onClick={onPauseHeartbeat}
        disabled={!isHeartbeatActive}
        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
      >
        <FaPause className="mr-2" />
        Pause Heartbeat
      </button>
      <button
        onClick={onResumeHeartbeat}
        disabled={isHeartbeatActive || !demoSession}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
      >
        <FaSync className="mr-2" />
        Resume Heartbeat
      </button>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={onRestoreBackup}
        disabled={!backupState || !!demoSession}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
      >
        <FaSync className="mr-2" />
        Restore Backup
      </button>
      <button
        onClick={onClearAll}
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center justify-center"
      >
        <FaTrash className="mr-2" />
        Clear All
      </button>
    </div>
  </div>
);

const StatusDisplay: React.FC<{
  demoSession: DemoSession | null;
  isHeartbeatActive: boolean;
  heartbeatCount: number;
  backupState: BackupState | null;
  formatDuration: (ms: number) => string;
}> = ({
  demoSession,
  isHeartbeatActive,
  heartbeatCount,
  backupState,
  formatDuration,
}) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-blue-300">Status</h3>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-300">Active Session:</span>
        <span className={demoSession ? "text-green-400" : "text-red-400"}>
          {demoSession ? "Yes" : "No"}
        </span>
      </div>
      {demoSession && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Session ID:</span>
            <span className="text-gray-100 font-mono text-sm">
              {demoSession.id.slice(-8)}...
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Duration:</span>
            <span className="text-gray-100">
              {formatDuration(
                Date.now() - new Date(demoSession.startTime).getTime(),
              )}
            </span>
          </div>
        </>
      )}
      <div className="flex justify-between items-center">
        <span className="text-gray-300">Heartbeat Active:</span>
        <span
          className={isHeartbeatActive ? "text-green-400" : "text-yellow-400"}
        >
          {isHeartbeatActive ? "Yes" : "No"}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-300">Heartbeat Count:</span>
        <span className="text-gray-100">{heartbeatCount}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-300">Backup Available:</span>
        <span className={backupState ? "text-green-400" : "text-red-400"}>
          {backupState ? "Yes" : "No"}
        </span>
      </div>
    </div>
  </div>
);

const ActivityLog: React.FC<{ logs: string[] }> = ({ logs }) => (
  <div className="mt-6 bg-gray-800 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-yellow-300">Activity Log</h3>
    <div className="bg-black p-3 rounded font-mono text-sm max-h-48 overflow-y-auto">
      {logs.length === 0 ? (
        <div className="text-gray-500">No activity yet...</div>
      ) : (
        logs.map((log, index) => (
          <div key={index} className="text-gray-300 mb-1">
            {log}
          </div>
        ))
      )}
    </div>
  </div>
);

const Instructions: React.FC = () => (
  <div className="mt-6 bg-gray-800 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-orange-300">How It Works</h3>
    <div className="text-sm text-gray-300 space-y-2">
      <p>
        1. <strong>Start Session:</strong> Creates a demo session and begins
        heartbeat backup
      </p>
      <p>
        2. <strong>Heartbeat:</strong> Every 2 seconds, the session state is
        backed up to localStorage
      </p>
      <p>
        3. <strong>Pause Heartbeat:</strong> Simulates app interruption (browser
        close, page reload)
      </p>
      <p>
        4. <strong>Restore Backup:</strong> Recovers the session from
        localStorage backup
      </p>
      <p>
        5. <strong>Open browser DevTools → Application → Local Storage</strong>{" "}
        to see the backup data
      </p>
    </div>
  </div>
);

/**
 * Demo component to showcase session persistence functionality
 * This simulates the core session persistence features without requiring
 * the full database and auth infrastructure
 */
// Custom hooks
const useBackupState = () => {
  const [backupState, setBackupState] = useState<BackupState | null>(null);
  const BACKUP_KEY = "demo_session_backup";

  useEffect(() => {
    // Demo uses localStorage for simple demonstration
    // In production, this would use proper storage service
    const backup = window.localStorage.getItem(BACKUP_KEY);
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        setBackupState(parsed);
      } catch {
        // Handle parsing error silently
      }
    }
  }, []);

  return { backupState, setBackupState, BACKUP_KEY };
};

const useActivityLog = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  return { logs, addLog, setLogs };
};

const useHeartbeat = (
  demoSession: DemoSession | null,
  isHeartbeatActive: boolean,
  setBackupState: (state: BackupState) => void,
  addLog: (message: string) => void,
  BACKUP_KEY: string,
) => {
  const [heartbeatCount, setHeartbeatCount] = useState(0);

  useEffect(() => {
    let interval: number | null = null;

    if (isHeartbeatActive && demoSession) {
      interval = setInterval(() => {
        setHeartbeatCount((prev) => {
          const newCount = prev + 1;
          const backupData = {
            sessionId: demoSession.id,
            startTime: demoSession.startTime,
            lastHeartbeat: new Date().toISOString(),
            duration: Date.now() - new Date(demoSession.startTime).getTime(),
          };

          // Demo uses localStorage for simple demonstration
          // In production, this would use proper storage service
          window.localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
          setBackupState(backupData);
          addLog(`💓 Heartbeat #${newCount} - Session backed up`);
          return newCount;
        });
      }, 2000) as unknown as number;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHeartbeatActive, demoSession, BACKUP_KEY]); // Removed functions from dependencies

  return { heartbeatCount, setHeartbeatCount };
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${remainingSeconds}s`;
};

// Session management functions
const useSessionManagement = (
  sessionHandlers: {
    setDemoSession: (session: DemoSession | null) => void;
    setIsHeartbeatActive: (active: boolean) => void;
    setHeartbeatCount: (count: number) => void;
    setBackupState: (state: BackupState | null) => void;
    setLogs: (logs: string[]) => void;
    addLog: (message: string) => void;
  },
  BACKUP_KEY: string,
) => {
  const startDemoSession = () => {
    const session = {
      id: `demo-${Date.now()}`,
      startTime: new Date().toISOString(),
      isPaused: false,
    };

    sessionHandlers.setDemoSession(session);
    sessionHandlers.setHeartbeatCount(0);
    sessionHandlers.setIsHeartbeatActive(true);
    sessionHandlers.addLog(`🚀 Session started: ${session.id}`);
  };

  const stopDemoSession = () => {
    sessionHandlers.setDemoSession(null);
    sessionHandlers.setIsHeartbeatActive(false);
    // Demo uses localStorage for simple demonstration
    window.localStorage.removeItem(BACKUP_KEY);
    sessionHandlers.setBackupState(null);
    sessionHandlers.addLog(`🛑 Session stopped and backup cleared`);
  };

  const pauseHeartbeat = () => {
    sessionHandlers.setIsHeartbeatActive(false);
    sessionHandlers.addLog(`⏸️ Heartbeat paused (simulating app interruption)`);
  };

  const resumeHeartbeat = (demoSession: DemoSession | null) => {
    if (demoSession) {
      sessionHandlers.setIsHeartbeatActive(true);
      sessionHandlers.addLog(`▶️ Heartbeat resumed`);
    }
  };

  const restoreFromBackup = (backupState: BackupState | null) => {
    if (backupState) {
      const restoredSession = {
        id: backupState.sessionId,
        startTime: backupState.startTime,
        isPaused: false,
      };

      sessionHandlers.setDemoSession(restoredSession);
      sessionHandlers.setIsHeartbeatActive(true);
      sessionHandlers.addLog(
        `🔄 Session restored from backup: ${restoredSession.id}`,
      );
    }
  };

  const clearAll = () => {
    sessionHandlers.setDemoSession(null);
    sessionHandlers.setIsHeartbeatActive(false);
    sessionHandlers.setBackupState(null);
    sessionHandlers.setHeartbeatCount(0);
    sessionHandlers.setLogs([]);
    // Demo uses localStorage for simple demonstration
    window.localStorage.removeItem(BACKUP_KEY);
    sessionHandlers.addLog("🗑️ All data cleared");
  };

  return {
    startDemoSession,
    stopDemoSession,
    pauseHeartbeat,
    resumeHeartbeat,
    restoreFromBackup,
    clearAll,
  };
};

export const SessionPersistenceDemo: React.FC = () => {
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);
  const [isHeartbeatActive, setIsHeartbeatActive] = useState(false);

  const { backupState, setBackupState, BACKUP_KEY } = useBackupState();
  const { logs, addLog, setLogs } = useActivityLog();
  const { heartbeatCount, setHeartbeatCount } = useHeartbeat(
    demoSession,
    isHeartbeatActive,
    setBackupState,
    addLog,
    BACKUP_KEY,
  );

  const {
    startDemoSession,
    stopDemoSession,
    pauseHeartbeat,
    resumeHeartbeat,
    restoreFromBackup,
    clearAll,
  } = useSessionManagement(
    {
      setDemoSession,
      setIsHeartbeatActive,
      setHeartbeatCount,
      setBackupState,
      setLogs,
      addLog,
    },
    BACKUP_KEY,
  );

  // Load backup state on mount
  useEffect(() => {
    if (backupState) {
      addLog("🔄 Backup state loaded from localStorage");
    }
  }, [backupState]); // Removed addLog from dependencies

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-purple-300">
        Session Persistence Demo
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemoControls
          demoSession={demoSession}
          backupState={backupState}
          isHeartbeatActive={isHeartbeatActive}
          onStartSession={startDemoSession}
          onStopSession={stopDemoSession}
          onPauseHeartbeat={pauseHeartbeat}
          onResumeHeartbeat={() => resumeHeartbeat(demoSession)}
          onRestoreBackup={() => restoreFromBackup(backupState)}
          onClearAll={clearAll}
        />

        <StatusDisplay
          demoSession={demoSession}
          isHeartbeatActive={isHeartbeatActive}
          heartbeatCount={heartbeatCount}
          backupState={backupState}
          formatDuration={formatDuration}
        />
      </div>

      <ActivityLog logs={logs} />
      <Instructions />
    </div>
  );
};
