/**
 * Achievement Privacy Settings Component
 * Allows users to control achievement visibility and leaderboard participation
 */

import React from "react";
import {
  FaEye,
  FaGlobe,
  FaShieldAlt,
  FaSave,
  FaTrophy,
  FaCalendar,
  FaClock,
  FaFire,
} from "../../utils/iconImport";
import { LeaderboardPrivacySettings } from "../../hooks/useLeaderboards";
import { useAuthState } from "../../contexts";
import { usePrivacySettings } from "../../hooks/achievements/usePrivacySettings";
import { ToggleGroup } from "@/components/ui";

// Sub-component for toggle switches
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  icon,
  title,
  description,
}) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
    <div className="flex items-center space-x-3">
      {icon}
      <div>
        <div className="font-medium text-nightly-honeydew">{title}</div>
        <div className="text-sm text-nightly-celadon">{description}</div>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nightly-aquamarine"></div>
    </label>
  </div>
);

// Note: RadioOption component removed - using ToggleGroup instead

// Sub-component for privacy notice
const PrivacyNotice: React.FC = () => (
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
);

// Sub-component for section headers
interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <h3 className="text-lg font-semibold text-nightly-honeydew border-b border-white/20 pb-2">
    {title}
  </h3>
);

// Component for Achievement Visibility section
interface AchievementVisibilitySectionProps {
  settings: LeaderboardPrivacySettings;
  onSettingChange: (
    key: keyof LeaderboardPrivacySettings,
    value: boolean,
  ) => void;
}

const AchievementVisibilitySection: React.FC<
  AchievementVisibilitySectionProps
> = ({ settings, onSettingChange }) => (
  <div className="space-y-4">
    <SectionHeader title="Achievement Visibility" />
    <div className="space-y-3">
      <ToggleSwitch
        checked={settings.showOnPublicProfile}
        onChange={(checked) => onSettingChange("showOnPublicProfile", checked)}
        icon={<FaEye className="text-nightly-aquamarine" />}
        title="Show on Public Profile"
        description="Display your achievements on your public profile"
      />
      <ToggleSwitch
        checked={settings.shareAchievements}
        onChange={(checked) => onSettingChange("shareAchievements", checked)}
        icon={<FaTrophy className="text-yellow-400" />}
        title="Share Achievements"
        description="Allow your achievements to be visible to others"
      />
    </div>
  </div>
);

// Component for Leaderboard Participation section
interface LeaderboardParticipationSectionProps {
  settings: LeaderboardPrivacySettings;
  onSettingChange: (
    key: keyof LeaderboardPrivacySettings,
    value: boolean,
  ) => void;
}

const LeaderboardParticipationSection: React.FC<
  LeaderboardParticipationSectionProps
> = ({ settings, onSettingChange }) => (
  <div className="space-y-4">
    <SectionHeader title="Leaderboard Participation" />
    <PrivacyNotice />
    <div className="space-y-3">
      <ToggleSwitch
        checked={settings.participateInGlobal}
        onChange={(checked) => onSettingChange("participateInGlobal", checked)}
        icon={<FaGlobe className="text-green-400" />}
        title="Global Leaderboards"
        description="Participate in all-time leaderboards"
      />
      <ToggleSwitch
        checked={settings.participateInMonthly}
        onChange={(checked) => onSettingChange("participateInMonthly", checked)}
        icon={<FaCalendar className="text-purple-400" />}
        title="Monthly Leaderboards"
        description="Participate in monthly competitive periods"
      />
    </div>
  </div>
);

// Component for Data Sharing section
interface DataSharingSectionProps {
  settings: LeaderboardPrivacySettings;
  onSettingChange: (
    key: keyof LeaderboardPrivacySettings,
    value: boolean,
  ) => void;
}

const DataSharingSection: React.FC<DataSharingSectionProps> = ({
  settings,
  onSettingChange,
}) => (
  <div className="space-y-4">
    <SectionHeader title="Data Sharing Preferences" />
    <div className="space-y-3">
      <ToggleSwitch
        checked={settings.shareSessionTime}
        onChange={(checked) => onSettingChange("shareSessionTime", checked)}
        icon={<FaClock className="text-nightly-aquamarine" />}
        title="Share Session Time"
        description="Include your session duration in leaderboards"
      />
      <ToggleSwitch
        checked={settings.shareStreakData}
        onChange={(checked) => onSettingChange("shareStreakData", checked)}
        icon={<FaFire className="text-red-400" />}
        title="Share Streak Data"
        description="Include your streak achievements in competitions"
      />
    </div>
  </div>
);

// Component for Display Name section
interface DisplayNameSectionProps {
  settings: LeaderboardPrivacySettings;
  onSettingChange: (
    key: keyof LeaderboardPrivacySettings,
    value: string,
  ) => void;
}

const DisplayNameSection: React.FC<DisplayNameSectionProps> = ({
  settings,
  onSettingChange,
}) => (
  <div className="space-y-4">
    <SectionHeader title="Display Name" />
    <div className="space-y-2">
      <div className="text-xs text-nightly-celadon mb-2">
        Choose how your name appears in leaderboards and public profiles
      </div>
      <ToggleGroup
        value={settings.displayName}
        onValueChange={(value) =>
          onSettingChange("displayName", value as string)
        }
        options={[
          { value: "anonymous", label: "Anonymous" },
          { value: "username", label: "Username" },
          { value: "real", label: "Real Name" },
        ]}
        type="single"
        fullWidth
        aria-label="Select display name preference"
      />
      <div className="text-xs text-nightly-celadon mt-2 space-y-1">
        <div>
          • <strong>Anonymous:</strong> Show as "ChastityUser_XXXX"
        </div>
        <div>
          • <strong>Username:</strong> Use your username if available
        </div>
        <div>
          • <strong>Real Name:</strong> Use your real name (not recommended)
        </div>
      </div>
    </div>
  </div>
);

export interface AchievementPrivacySettingsProps {
  onClose?: () => void;
}

export const AchievementPrivacySettings: React.FC<
  AchievementPrivacySettingsProps
> = ({ onClose }) => {
  const { user } = useAuthState();
  const { settings, hasChanges, updateSetting, handleSave, isLoading } =
    usePrivacySettings(user?.uid, onClose);

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
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            ×
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <AchievementVisibilitySection
          settings={settings}
          onSettingChange={updateSetting}
        />

        <LeaderboardParticipationSection
          settings={settings}
          onSettingChange={updateSetting}
        />

        <DataSharingSection
          settings={settings}
          onSettingChange={updateSetting}
        />

        <DisplayNameSection
          settings={settings}
          onSettingChange={updateSetting}
        />

        {/* Save Button */}
        <div className="flex justify-end space-x-3 pt-4">
          {onClose && (
            <Button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
              hasChanges && !isLoading
                ? "bg-nightly-aquamarine text-black hover:bg-nightly-aquamarine/80"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FaSave />
            <span>{isLoading ? "Saving..." : "Save Settings"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AchievementPrivacySettings;
