import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import { settingsDBService } from "../services/database";
import type { DBSettings } from "../types/database";
import { logger } from "../utils/logging";
import {
  FaUser,
  FaPalette,
  FaGlobe,
  FaBullseye,
  FaCog,
  FaDatabase,
  FaDownload,
  FaUpload,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaLock,
  FaShield,
} from "react-icons/fa";

type SettingsTab =
  | "account"
  | "display"
  | "profile"
  | "privacy"
  | "goals"
  | "sessions"
  | "data";

// Account Settings Section
const AccountSection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaUser className="text-nightly-aquamarine" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Account Information
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Display Name
          </label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
            placeholder="Enter display name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Email
          </label>
          <input
            type="email"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
            placeholder="Enter email address"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Two-Factor Authentication
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Add extra security to your account
            </div>
          </div>
          <button className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded transition-colors">
            Setup 2FA
          </button>
        </div>

        <button className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

// Display Settings Section
const DisplaySection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaPalette className="text-nightly-lavender-floral" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Display Settings
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Theme
          </label>
          <select className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Language
          </label>
          <select className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Timezone
          </label>
          <select className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew">
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Notifications
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Receive app notifications
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
          </label>
        </div>
      </div>
    </div>
  </div>
);

// Public Profile Section
const ProfileSection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaGlobe className="text-nightly-spring-green" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Public Profile
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Public Profile
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Make your profile visible to others
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-spring-green"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Share Statistics
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Allow others to see your progress stats
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-spring-green"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Bio
          </label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={3}
            placeholder="Tell others about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Profile URL
          </label>
          <div className="flex">
            <span className="bg-white/5 border border-white/10 border-r-0 rounded-l px-3 py-3 text-nightly-celadon text-sm">
              chastityos.com/profile/
            </span>
            <input
              type="text"
              className="flex-1 bg-white/5 border border-white/10 rounded-r p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
              placeholder="your-username"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Privacy Settings Section
const PrivacySection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaShield className="text-nightly-lavender-floral" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Privacy & Security
        </h3>
      </div>

      <div className="space-y-4">
        {/* Data Collection */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Data Collection
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Allow collection of usage analytics
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
          </label>
        </div>

        {/* Data Sharing */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Data Sharing
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Share anonymous usage data to improve the app
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
          </label>
        </div>

        {/* Account Visibility */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Account Discoverable
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Allow others to find your account by username
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
          </label>
        </div>

        {/* Activity Status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Show Activity Status
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Let others see when you're active
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
          </label>
        </div>
      </div>
    </div>

    {/* Security Settings */}
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaLock className="text-nightly-aquamarine" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Security Settings
        </h3>
      </div>

      <div className="space-y-4">
        {/* Session Timeout */}
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Auto-logout After Inactivity
          </label>
          <select className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew">
            <option value="never">Never</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="240">4 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>

        {/* Login Alerts */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Login Alerts
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Get notified of new logins to your account
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
          </label>
        </div>

        {/* Device Management */}
        <div>
          <div className="text-sm font-medium text-nightly-celadon mb-2">
            Logged In Devices
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/5 rounded p-3">
              <div>
                <div className="text-sm text-nightly-honeydew">
                  Current Device (Chrome on macOS)
                </div>
                <div className="text-xs text-nightly-celadon/70">
                  Last used: Just now
                </div>
              </div>
              <span className="text-green-400 text-xs">Active</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded p-3">
              <div>
                <div className="text-sm text-nightly-honeydew">
                  iPhone (Safari)
                </div>
                <div className="text-xs text-nightly-celadon/70">
                  Last used: 2 hours ago
                </div>
              </div>
              <button className="text-red-400 hover:text-red-300 text-xs">
                Remove
              </button>
            </div>
          </div>
          <button className="mt-2 text-nightly-aquamarine hover:text-nightly-spring-green text-sm">
            Log out all other devices
          </button>
        </div>
      </div>
    </div>

    {/* Data Controls */}
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaDatabase className="text-nightly-spring-green" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Data Controls
        </h3>
      </div>

      <div className="space-y-4">
        {/* Data Export */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Export My Data
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Download all your data in JSON format
            </div>
          </div>
          <button className="bg-nightly-spring-green/20 hover:bg-nightly-spring-green/30 text-nightly-spring-green px-4 py-2 rounded font-medium transition-colors flex items-center gap-2">
            <FaDownload />
            Export
          </button>
        </div>

        {/* Account Deletion */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <div className="text-sm font-medium text-red-400">
              Delete Account
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Permanently delete your account and all data
            </div>
          </div>
          <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded font-medium transition-colors flex items-center gap-2">
            <FaTrash />
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Goals Section
const GoalsSection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaBullseye className="text-nightly-aquamarine" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Personal Goals
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Default Session Goal (hours)
          </label>
          <input
            type="number"
            min="1"
            max="168"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
            placeholder="24"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Goal Reminders
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Get notified about goal progress
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
          </label>
        </div>

        <button className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors">
          Create New Goal
        </button>
      </div>
    </div>
  </div>
);

// Session Settings Section
const SessionSection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaCog className="text-nightly-lavender-floral" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Session Settings
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Allow Emergency Unlock
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Enable emergency unlock feature
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-nightly-celadon mb-2">
            Emergency Unlock Cooldown (hours)
          </label>
          <input
            type="number"
            min="1"
            max="168"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
            placeholder="24"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Require Keyholder Approval
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Sessions need keyholder approval to end
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-lavender-floral"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-nightly-celadon">
              Hardcore Mode
            </div>
            <div className="text-xs text-nightly-celadon/70">
              Disable pause and emergency unlock
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>
      </div>
    </div>
  </div>
);

// Data Management Section
const DataSection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStatus, setResetStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaDatabase className="text-nightly-spring-green" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">
            Data Management
          </h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black p-4 rounded-lg font-medium transition-colors flex items-center gap-3">
              <FaDownload />
              Export Data
            </button>

            <button className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white p-4 rounded-lg font-medium transition-colors flex items-center gap-3">
              <FaUpload />
              Import Data
            </button>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2">Danger Zone</h4>
              <p className="text-nightly-celadon text-sm mb-4">
                Reset all data will permanently delete all your sessions, tasks,
                goals, and settings. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowResetModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
              >
                <FaTrash />
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-nightly-dark-purple border border-white/10 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-red-400 mb-4">
              Confirm Data Reset
            </h3>

            {resetStatus === "idle" && (
              <>
                <p className="text-nightly-celadon mb-6">
                  Are you sure you want to reset all your data? This action
                  cannot be undone and will delete:
                </p>
                <ul className="text-nightly-celadon text-sm mb-6 list-disc list-inside space-y-1">
                  <li>All chastity sessions</li>
                  <li>All logged events</li>
                  <li>All tasks and goals</li>
                  <li>All settings and preferences</li>
                </ul>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setResetStatus("pending");
                      // Simulate reset process
                      setTimeout(() => {
                        setResetStatus("success");
                        setTimeout(() => {
                          window.location.reload();
                        }, 2000);
                      }, 2000);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-4 py-2 rounded font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {resetStatus === "pending" && (
              <div className="text-center">
                <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
                <p className="text-nightly-celadon">Resetting all data...</p>
              </div>
            )}

            {resetStatus === "success" && (
              <div className="text-center">
                <div className="text-2xl text-green-400 mb-4">✓</div>
                <p className="text-nightly-celadon">
                  Data reset complete. Refreshing...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const { user } = useAuthState();
  const [settings, setSettings] = useState<DBSettings | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Try to get user settings
        const userSettings = await settingsDBService.findByUserId(user.uid);
        setSettings(userSettings[0] || null);
      } catch (error) {
        logger.error("Error fetching settings:", error, "SettingsPage");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const tabs = [
    { id: "account" as SettingsTab, label: "Account", icon: FaUser },
    { id: "display" as SettingsTab, label: "Display", icon: FaPalette },
    { id: "profile" as SettingsTab, label: "Profile", icon: FaGlobe },
    { id: "privacy" as SettingsTab, label: "Privacy", icon: FaShield },
    { id: "goals" as SettingsTab, label: "Goals", icon: FaBullseye },
    { id: "sessions" as SettingsTab, label: "Sessions", icon: FaCog },
    { id: "data" as SettingsTab, label: "Data", icon: FaDatabase },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountSection settings={settings} />;
      case "display":
        return <DisplaySection settings={settings} />;
      case "profile":
        return <ProfileSection settings={settings} />;
      case "privacy":
        return <PrivacySection settings={settings} />;
      case "goals":
        return <GoalsSection settings={settings} />;
      case "sessions":
        return <SessionSection settings={settings} />;
      case "data":
        return <DataSection settings={settings} />;
      default:
        return <AccountSection settings={settings} />;
    }
  };

  return (
    <div className="text-nightly-spring-green">
      <div className="flex flex-col lg:flex-row">
        {/* Tab Navigation */}
        <nav className="lg:w-64 p-4 border-b lg:border-b-0 lg:border-r border-white/10">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-nightly-aquamarine text-black"
                      : "text-nightly-celadon hover:bg-white/10 hover:text-nightly-honeydew"
                  }`}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          {loading ? (
            <div className="text-center py-8">
              <FaSpinner className="animate-spin text-2xl text-nightly-aquamarine mb-4 mx-auto" />
              <div className="text-nightly-celadon">Loading settings...</div>
            </div>
          ) : (
            <div className="max-w-4xl">{renderTabContent()}</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
