import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import {
  FaPlay,
  FaStop,
  FaPause,
  FaSync,
  FaTrash,
} from "../../utils/iconImport";

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

/**
 * Demo component to showcase session persistence functionality
 * This simulates the core session persistence features without requiring
 * the full database and auth infrastructure
 */
export const SessionPersistenceDemo: React.FC = () => {
  const [demoSession, setDemoSession] = useState<DemoSession | null>(null);
  const [backupState, setBackupState] = useState<BackupState | null>(null);
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [isHeartbeatActive, setIsHeartbeatActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Define addLog before it's used in effects - wrapped in useCallback for stable reference
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  }, []);

  // Load backup state on mount
  useEffect(() => {
    // Demo component: simulate localStorage behavior without direct access
    const simulateBackupLoad = () => {
      // In a real implementation, this would use Dexie service through hooks
      const mockBackup = null; // Simulated storage access
      if (mockBackup) {
        try {
          const parsed = JSON.parse(mockBackup);
          setBackupState(parsed);
          addLog("🔄 Backup state loaded from storage service");
        } catch {
          addLog("❌ Failed to parse backup state");
        }
      }
    };
    simulateBackupLoad();
    // addLog is a stable useCallback function, not a zustand store action
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [addLog]);

  // Update current time for duration display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second for demo

    return () => clearInterval(interval);
  }, []);

  // Heartbeat simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isHeartbeatActive && demoSession) {
      interval = setInterval(() => {
        setHeartbeatCount((prev) => prev + 1);

        // Simulate backup storage (in real app, would use Dexie service)
        const backupData = {
          sessionId: demoSession.id,
          startTime: demoSession.startTime,
          lastHeartbeat: new Date().toISOString(),
          duration: Date.now() - new Date(demoSession.startTime).getTime(),
        };

        // Demo: simulate storage without direct localStorage access
        setBackupState(backupData);

        addLog(`💓 Heartbeat #${heartbeatCount + 1} - Session backed up`);
      }, 2000); // Every 2 seconds for demo
    }

    return () => {
      if (interval) clearInterval(interval);
    };
    // addLog is a stable useCallback function, not a zustand store action
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [isHeartbeatActive, demoSession, heartbeatCount, addLog]);

  const startDemoSession = () => {
    const session = {
      id: `demo-${Date.now()}`,
      startTime: new Date().toISOString(),
      isPaused: false,
    };

    setDemoSession(session);
    setHeartbeatCount(0);
    setIsHeartbeatActive(true);
    addLog(`🚀 Session started: ${session.id}`);
  };

  const stopDemoSession = () => {
    if (demoSession) {
      setDemoSession(null);
      setIsHeartbeatActive(false);
      // Demo: simulate clearing storage without direct localStorage access
      setBackupState(null);
      addLog(`🛑 Session stopped and backup cleared`);
    }
  };

  const pauseHeartbeat = () => {
    setIsHeartbeatActive(false);
    addLog(`⏸️ Heartbeat paused (simulating app interruption)`);
  };

  const resumeHeartbeat = () => {
    if (demoSession) {
      setIsHeartbeatActive(true);
      addLog(`▶️ Heartbeat resumed`);
    }
  };

  const restoreFromBackup = () => {
    if (backupState) {
      const restoredSession = {
        id: backupState.sessionId,
        startTime: backupState.startTime,
        isPaused: false,
      };

      setDemoSession(restoredSession);
      setIsHeartbeatActive(true);
      addLog(`🔄 Session restored from backup: ${restoredSession.id}`);
    }
  };

  const clearAll = () => {
    setDemoSession(null);
    setIsHeartbeatActive(false);
    setBackupState(null);
    setHeartbeatCount(0);
    setLogs([]);
    // Demo: simulate clearing storage without direct localStorage access
    addLog("🗑️ All data cleared");
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-purple-300">
        Session Persistence Demo
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-green-300">
            Controls
          </h3>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              onClick={startDemoSession}
              disabled={!!demoSession}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
            >
              <FaPlay className="mr-2" />
              Start Session
            </Button>

            <Button
              onClick={stopDemoSession}
              disabled={!demoSession}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
            >
              <FaStop className="mr-2" />
              Stop Session
            </Button>

            <Button
              onClick={pauseHeartbeat}
              disabled={!isHeartbeatActive}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
            >
              <FaPause className="mr-2" />
              Pause Heartbeat
            </Button>

            <Button
              onClick={resumeHeartbeat}
              disabled={isHeartbeatActive || !demoSession}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
            >
              <FaSync className="mr-2" />
              Resume Heartbeat
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={restoreFromBackup}
              disabled={!backupState || !!demoSession}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded flex items-center justify-center"
            >
              <FaSync className="mr-2" />
              Restore Backup
            </Button>

            <Button
              onClick={clearAll}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center justify-center"
            >
              <FaTrash className="mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Status */}
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
                      currentTime - new Date(demoSession.startTime).getTime(),
                    )}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-300">Heartbeat Active:</span>
              <span
                className={
                  isHeartbeatActive ? "text-green-400" : "text-yellow-400"
                }
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
      </div>

      {/* Activity Log */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-yellow-300">
          Activity Log
        </h3>
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

      {/* Instructions */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-orange-300">
          How It Works
        </h3>
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
            3. <strong>Pause Heartbeat:</strong> Simulates app interruption
            (browser close, page reload)
          </p>
          <p>
            4. <strong>Restore Backup:</strong> Recovers the session from
            localStorage backup
          </p>
          <p>
            5.{" "}
            <strong>Open browser DevTools → Application → Local Storage</strong>{" "}
            to see the backup data
          </p>
        </div>
      </div>
    </div>
  );
};
