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
  FaDatabase,
  FaSpinner,
  FaShieldAlt,
} from "../utils/iconImport";
import { ToggleSwitch } from "../components/settings/ToggleSwitch";
import { SecuritySettings } from "../components/settings/SecuritySettings";
import { DataControls } from "../components/settings/DataControls";
import { PersonalGoalSection } from "../components/settings/PersonalGoalSection";
import { KeyholderDurationSection } from "../components/settings/KeyholderDurationSection";

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
  settings: _settings,
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
            Submissive's Name
          </label>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
            placeholder="Enter submissive's name"
          />
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
  settings: _settings,
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
            Timezone
          </label>
          <select className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew">
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="America/Phoenix">Arizona Time</option>
            <option value="America/Anchorage">Alaska Time</option>
            <option value="Pacific/Honolulu">Hawaii Time</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Australia/Sydney">Sydney (AEDT)</option>
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
  settings: _settings,
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
  settings: _settings,
}) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaShieldAlt className="text-nightly-lavender-floral" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Privacy & Security
        </h3>
      </div>

      <div className="space-y-4">
        <ToggleSwitch
          label="Data Collection (Opt-Out)"
          description="Allow collection of anonymous usage analytics to improve the app"
          checked={false}
        />
        <ToggleSwitch
          label="Account Discoverable"
          description="Allow others to find your account by username"
          checked={true}
        />
        <ToggleSwitch
          label="Show Activity Status"
          description="Let others see when you're active"
        />
      </div>
    </div>

    <SecuritySettings />
  </div>
);

// Goals Section
const GoalsSection: React.FC<{ settings: DBSettings | null }> = ({
  settings: _settings,
}) => {
  const { user } = useAuthState();

  return (
    <div className="space-y-6">
      {/* Personal Goal Section */}
      <PersonalGoalSection userId={user?.uid} />

      {/* Keyholder Duration Section */}
      <KeyholderDurationSection userId={user?.uid} />
    </div>
  );
};

// Data Management Section
const DataSection: React.FC<{ settings: DBSettings | null }> = ({
  settings: _settings,
}) => {
  return (
    <div className="space-y-6">
      <DataControls />
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
    { id: "privacy" as SettingsTab, label: "Privacy", icon: FaShieldAlt },
    { id: "goals" as SettingsTab, label: "Goals", icon: FaBullseye },
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
