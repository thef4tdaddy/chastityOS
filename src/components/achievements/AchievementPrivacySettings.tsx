/**
 * Achievement Privacy Settings Component
 * Allows users to control achievement visibility and leaderboard participation
 */

import React, { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaUsers,
  FaGlobe,
  FaShieldAlt,
  FaSave,
} from "../../utils/iconImport";
import { useLeaderboards } from "../../hooks/useLeaderboards";
import { useAuthState } from "../../contexts";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("AchievementPrivacySettings");

export interface AchievementPrivacySettingsProps {
  onClose?: () => void;
}

export const AchievementPrivacySettings: React.FC<
  AchievementPrivacySettingsProps
> = ({ onClose }) => {
  const { user } = useAuthState();
  const { privacySettings, updateLeaderboardPrivacy, isUpdatingPrivacy } =
    useLeaderboards(user?.uid);

  const [settings, setSettings] = useState(privacySettings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateLeaderboardPrivacy(settings);
      setHasChanges(false);
      if (onClose) onClose();
    } catch (error) {
      logger.error("Failed to save privacy settings", { error });
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FaShieldAlt className="text-2xl text-nightly-lavender-floral" />
          <h2 className="text-2xl font-bold text-nightly-honeydew">
            Privacy Settings
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Achievement Visibility */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-nightly-honeydew border-b border-white/20 pb-2">
            Achievement Visibility
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaEye className="text-nightly-aquamarine" />
                <div>
                  <div className="font-medium text-nightly-honeydew">
                    Show on Public Profile
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    Display your achievements on your public profile
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showOnPublicProfile}
                  onChange={(e) =>
                    handleSettingChange("showOnPublicProfile", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaTrophy className="text-yellow-400" />
                <div>
                  <div className="font-medium text-nightly-honeydew">
                    Share Achievements
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    Allow your achievements to be visible to others
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shareAchievements}
                  onChange={(e) =>
                    handleSettingChange("shareAchievements", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Leaderboard Participation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-nightly-honeydew border-b border-white/20 pb-2">
            Leaderboard Participation
          </h3>

          <div className="bg-blue-900/20 p-4 rounded-lg text-sm text-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <FaShieldAlt className="text-blue-300" />
              <span className="font-semibold text-blue-300">Privacy Note:</span>
            </div>
            <p>
              All leaderboard participation is anonymous by default. No personal
              information is shared.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaGlobe className="text-green-400" />
                <div>
                  <div className="font-medium text-nightly-honeydew">
                    Global Leaderboards
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    Participate in all-time leaderboards
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.participateInGlobal}
                  onChange={(e) =>
                    handleSettingChange("participateInGlobal", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaCalendar className="text-purple-400" />
                <div>
                  <div className="font-medium text-nightly-honeydew">
                    Monthly Leaderboards
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    Participate in monthly competitive periods
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.participateInMonthly}
                  onChange={(e) =>
                    handleSettingChange(
                      "participateInMonthly",
                      e.target.checked,
                    )
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-nightly-honeydew border-b border-white/20 pb-2">
            Data Sharing Preferences
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaClock className="text-nightly-aquamarine" />
                <div>
                  <div className="font-medium text-nightly-honeydew">
                    Share Session Time
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    Include your session duration in leaderboards
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shareSessionTime}
                  onChange={(e) =>
                    handleSettingChange("shareSessionTime", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nighty-aquamarine"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaFire className="text-red-400" />
                <div>
                  <div className="font-medium text-nighty-honeydew">
                    Share Streak Data
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    Include your streak achievements in competitions
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shareStreakData}
                  onChange={(e) =>
                    handleSettingChange("shareStreakData", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Display Name Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-nightly-honeydew border-b border-white/20 pb-2">
            Display Name
          </h3>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="displayName"
                value="anonymous"
                checked={settings.displayName === "anonymous"}
                onChange={(e) =>
                  handleSettingChange("displayName", e.target.value)
                }
                className="text-nightly-aquamarine focus:ring-nightly-aquamarine"
              />
              <div>
                <div className="font-medium text-nightly-honeydew">
                  Anonymous
                </div>
                <div className="text-sm text-nightly-celadon">
                  Show as "ChastityUser_XXXX"
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="displayName"
                value="username"
                checked={settings.displayName === "username"}
                onChange={(e) =>
                  handleSettingChange("displayName", e.target.value)
                }
                className="text-nightly-aquamarine focus:ring-nightly-aquamarine"
              />
              <div>
                <div className="font-medium text-nightly-honeydew">
                  Username
                </div>
                <div className="text-sm text-nightly-celadon">
                  Use your username if available
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="displayName"
                value="real"
                checked={settings.displayName === "real"}
                onChange={(e) =>
                  handleSettingChange("displayName", e.target.value)
                }
                className="text-nightly-aquamarine focus:ring-nightly-aquamarine"
              />
              <div>
                <div className="font-medium text-nightly-honeydew">
                  Real Name
                </div>
                <div className="text-sm text-nightly-celadon">
                  Use your real name (not recommended)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3 pt-4">
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isUpdatingPrivacy}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
              hasChanges && !isUpdatingPrivacy
                ? "bg-nightly-aquamarine text-black hover:bg-nighty-aquamarine/80"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FaSave />
            <span>{isUpdatingPrivacy ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementPrivacySettings;
