import React, { useState, useEffect } from "react";
import { useAuthState } from "@/contexts";
import { settingsDBService } from "@/services/database";
import type { DBSettings } from "@/types/database";
import { logger } from "@/utils/logging";
import {
  FaUser,
  FaPalette,
  FaGlobe,
  FaBullseye,
  FaDatabase,
  FaSpinner,
  FaShieldAlt,
  FaCheckCircle,
} from "@/utils/iconImport";
import { ToggleSwitch } from "@/components/settings/ToggleSwitch";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { DataControls } from "@/components/settings/DataControls";
import { PersonalGoalSection } from "@/components/settings/PersonalGoalSection";
import { KeyholderDurationSection } from "@/components/settings/KeyholderDurationSection";
import { PeriodicSyncSection } from "@/components/settings/PeriodicSyncSection";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useIsAnonymous } from "@/hooks/useIsAnonymous";
import {
  useUpdateAccountSettings,
  useUpdateDisplaySettings,
  useUpdateProfileSettings,
  useUpdatePrivacySettings,
} from "@/hooks/api/useSettings";
import {
  validateAccountSettings,
  validateDisplaySettings,
  validateProfileSettings,
} from "@/utils/validation/settingsValidation";
import {
  Input,
  Textarea,
  LoadingState,
  Tooltip,
  Tabs,
  TabsContent,
  Select,
  SelectOption,
  Button,
  Switch,
} from "@/components/ui";
import { TimezoneUtil } from "@/utils/timezone";
import { toastBridge } from "@/utils/toastBridge";

type SettingsTab =
  | "account"
  | "display"
  | "profile"
  | "privacy"
  | "goals"
  | "sessions"
  | "sync"
  | "data";

// Account Settings Section
/* eslint-disable max-lines-per-function */
const AccountSection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => {
  const { user } = useAuthState();
  const isAnonymous = useIsAnonymous();
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Account settings state
  const [submissiveName, setSubmissiveName] = useState(
    settings?.submissiveName || "",
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update local state when settings change
  useEffect(() => {
    if (settings?.submissiveName) {
      setSubmissiveName(settings.submissiveName);
    }
  }, [settings?.submissiveName]);

  // Mutation hook
  const updateAccountMutation = useUpdateAccountSettings();

  const handleSave = async () => {
    if (!user?.uid) return;

    // Validate input
    const validation = validateAccountSettings({ submissiveName });
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid input");
      return;
    }

    setValidationError(null);

    try {
      await updateAccountMutation.mutateAsync({
        userId: user.uid,
        data: { submissiveName },
      });

      toastBridge.showSuccess?.("Account settings saved successfully");
    } catch (error) {
      logger.error("Failed to save account settings", error);
      toastBridge.showError?.("Failed to save account settings");
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaUser className="text-nightly-aquamarine" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">
            Account Status
          </h3>
        </div>

        <div className="space-y-4">
          {/* Account Type */}
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <div className="text-sm font-medium text-nightly-celadon">
                Account Type
              </div>
              <div className="text-xs text-nightly-celadon/70 mt-1">
                {isAnonymous ? "Temporary (Anonymous)" : "Permanent (Google)"}
              </div>
            </div>
            <div>
              {isAnonymous ? (
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-medium">
                  Temporary
                </span>
              ) : (
                <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                  <FaCheckCircle className="text-xs" />
                  <span>Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          {user?.email && (
            <div className="py-3 border-b border-white/10">
              <div className="text-sm font-medium text-nightly-celadon mb-2">
                Email
              </div>
              <div className="text-nightly-honeydew">{user.email}</div>
            </div>
          )}

          {/* Google Sign-In Section */}
          {isAnonymous ? (
            <div className="pt-2">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">
                  Upgrade Your Account
                </h4>
                <p className="text-xs text-blue-200/80 mb-3">
                  Link your account with Google to:
                </p>
                <ul className="text-xs text-blue-200/80 mb-4 ml-4 space-y-1">
                  <li>✓ Backup your data to the cloud</li>
                  <li>✓ Sync across multiple devices</li>
                  <li>✓ Never lose your progress</li>
                  <li>✓ Access keyholder features</li>
                </ul>

                {linkError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-red-400">{linkError}</p>
                  </div>
                )}

                {linkSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-green-400">
                      Account linked successfully!
                    </p>
                  </div>
                )}

                <GoogleSignInButton
                  mode="link"
                  onSuccess={() => {
                    setLinkSuccess(true);
                    setLinkError(null);
                  }}
                  onError={(error) => {
                    setLinkError(error);
                    setLinkSuccess(false);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FaCheckCircle className="text-green-400" />
                  <h4 className="text-sm font-semibold text-green-300">
                    Account Secured
                  </h4>
                </div>
                <p className="text-xs text-green-200/80">
                  Your account is linked with Google. Your data is backed up and
                  synced across all your devices.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaUser className="text-nightly-aquamarine" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">
            Profile Information
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-nightly-celadon">
                Submissive's Name
              </label>
              <Tooltip content="This name will be displayed throughout the app and shared with your keyholder">
                <span className="text-nightly-aquamarine/60 cursor-help text-xs">
                  ⓘ
                </span>
              </Tooltip>
            </div>
            <Input
              type="text"
              value={submissiveName}
              onChange={(e) => {
                setSubmissiveName(e.target.value);
                setValidationError(null);
              }}
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
              placeholder="Enter submissive's name"
            />
            {validationError && (
              <p className="text-red-400 text-xs mt-1">{validationError}</p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={updateAccountMutation.isPending}
            className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updateAccountMutation.isPending && (
              <FaSpinner className="animate-spin" />
            )}
            {updateAccountMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get initial timezone
const getInitialTimezone = (settings: DBSettings | null): string => {
  return (
    settings?.display?.timezone ||
    settings?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
};

// Sync Settings Section
const SyncSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <PeriodicSyncSection />
    </div>
  );
};

// Display Settings Section
const DisplaySection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => {
  const { user } = useAuthState();

  // Display settings state
  const [timezone, setTimezone] = useState(getInitialTimezone(settings));
  const [notifications, setNotifications] = useState(() => {
    if (typeof settings?.notifications === "object" && settings.notifications) {
      return settings.notifications.enabled ?? true;
    }
    return settings?.notifications ?? true;
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update local state when settings change
  useEffect(() => {
    const newTimezone = settings?.display?.timezone || settings?.timezone;
    if (newTimezone) {
      setTimezone(newTimezone);
    }
    if (settings?.notifications) {
      if (typeof settings.notifications === "object") {
        if (settings.notifications.enabled !== undefined) {
          setNotifications(settings.notifications.enabled);
        }
      } else {
        setNotifications(settings.notifications);
      }
    }
  }, [
    settings?.display?.timezone,
    settings?.timezone,
    settings?.notifications,
  ]);

  // Mutation hook
  const updateDisplayMutation = useUpdateDisplaySettings();

  // Get timezone options
  const timezoneOptions = TimezoneUtil.getCommonTimezones();

  const handleSave = async () => {
    if (!user?.uid) return;

    // Validate input
    const validation = validateDisplaySettings({ timezone });
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid input");
      return;
    }

    setValidationError(null);

    try {
      await updateDisplayMutation.mutateAsync({
        userId: user.uid,
        data: { timezone, notifications },
      });

      toastBridge.showSuccess?.("Display settings saved successfully");
    } catch (error) {
      logger.error("Failed to save display settings", error);
      toastBridge.showError?.("Failed to save display settings");
    }
  };

  return (
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
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-nightly-celadon">
                Timezone
              </label>
              <Tooltip content="Set your timezone for accurate time tracking and reports">
                <span className="text-nightly-lavender-floral/60 cursor-help text-xs">
                  ⓘ
                </span>
              </Tooltip>
            </div>
            <Select
              value={timezone}
              onChange={(value) => {
                setTimezone(value as string);
                setValidationError(null);
              }}
              options={timezoneOptions as SelectOption[]}
              error={validationError || undefined}
              searchable
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-sm font-medium text-nightly-celadon">
                  Notifications
                </div>
                <div className="text-xs text-nightly-celadon/70">
                  Receive app notifications
                </div>
              </div>
              <Tooltip content="Enable browser notifications for task updates and reminders">
                <span className="text-nightly-lavender-floral/60 cursor-help text-xs">
                  ⓘ
                </span>
              </Tooltip>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={updateDisplayMutation.isPending}
            className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-black px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updateDisplayMutation.isPending && (
              <FaSpinner className="animate-spin" />
            )}
            {updateDisplayMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Public Profile Section
const ProfileSection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => {
  const { user } = useAuthState();

  // Profile settings state
  const [publicProfile, setPublicProfile] = useState(
    settings?.privacy?.publicProfile ?? false,
  );
  const [shareStatistics, setShareStatistics] = useState(
    settings?.shareStatistics ?? false,
  );
  const [bio, setBio] = useState(settings?.bio || "");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update local state when settings change
  useEffect(() => {
    if (settings?.privacy?.publicProfile !== undefined) {
      setPublicProfile(settings.privacy.publicProfile);
    }
    if (settings?.shareStatistics !== undefined) {
      setShareStatistics(settings.shareStatistics);
    }
    if (settings?.bio !== undefined) {
      setBio(settings.bio);
    }
  }, [
    settings?.privacy?.publicProfile,
    settings?.shareStatistics,
    settings?.bio,
  ]);

  // Mutation hook
  const updateProfileMutation = useUpdateProfileSettings();

  const handleSave = async () => {
    if (!user?.uid) return;

    // Validate input
    const validation = validateProfileSettings({ bio });
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid input");
      return;
    }

    setValidationError(null);

    try {
      await updateProfileMutation.mutateAsync({
        userId: user.uid,
        data: { publicProfile, shareStatistics, bio },
      });

      toastBridge.showSuccess?.("Profile settings saved successfully");
    } catch (error) {
      logger.error("Failed to save profile settings", error);
      toastBridge.showError?.("Failed to save profile settings");
    }
  };

  return (
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
            <Switch
              checked={publicProfile}
              onCheckedChange={setPublicProfile}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-sm font-medium text-nightly-celadon">
                  Share Statistics
                </div>
                <div className="text-xs text-nightly-celadon/70">
                  Allow others to see your progress stats
                </div>
              </div>
              <Tooltip content="When enabled, your chastity stats will be visible on your public profile">
                <span className="text-nightly-spring-green/60 cursor-help text-xs">
                  ⓘ
                </span>
              </Tooltip>
            </div>
            <Switch
              checked={shareStatistics}
              onCheckedChange={setShareStatistics}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Bio
            </label>
            <Textarea
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setValidationError(null);
              }}
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
              rows={3}
              placeholder="Tell others about yourself..."
            />
            {validationError && (
              <p className="text-red-400 text-xs mt-1">{validationError}</p>
            )}
            <p className="text-nightly-celadon/70 text-xs mt-1">
              {bio.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Profile URL
            </label>
            <div className="flex">
              <span className="bg-white/5 border border-white/10 border-r-0 rounded-l px-3 py-3 text-nightly-celadon text-sm">
                chastityOS.io/profile/
              </span>
              <Input
                type="text"
                className="flex-1 bg-white/5 border border-white/10 rounded-r p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
                placeholder="your-username"
                disabled
              />
            </div>
            <p className="text-nightly-celadon/70 text-xs mt-1">
              Profile URL customization coming soon
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="bg-nightly-spring-green hover:bg-nightly-spring-green/80 text-black px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updateProfileMutation.isPending && (
              <FaSpinner className="animate-spin" />
            )}
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Privacy Settings Section
const PrivacySection: React.FC<{ settings: DBSettings | null }> = ({
  settings,
}) => {
  const { user } = useAuthState();

  // Privacy settings state
  const [dataCollection, setDataCollection] = useState(
    settings?.dataCollection ?? false,
  );
  const [accountDiscoverable, setAccountDiscoverable] = useState(
    settings?.accountDiscoverable ?? true,
  );
  const [showActivityStatus, setShowActivityStatus] = useState(
    settings?.showActivityStatus ?? false,
  );

  // Update local state when settings change
  useEffect(() => {
    if (settings?.dataCollection !== undefined) {
      setDataCollection(settings.dataCollection);
    }
    if (settings?.accountDiscoverable !== undefined) {
      setAccountDiscoverable(settings.accountDiscoverable);
    }
    if (settings?.showActivityStatus !== undefined) {
      setShowActivityStatus(settings.showActivityStatus);
    }
  }, [
    settings?.dataCollection,
    settings?.accountDiscoverable,
    settings?.showActivityStatus,
  ]);

  // Mutation hook
  const updatePrivacyMutation = useUpdatePrivacySettings();

  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      await updatePrivacyMutation.mutateAsync({
        userId: user.uid,
        data: { dataCollection, accountDiscoverable, showActivityStatus },
      });

      toastBridge.showSuccess?.("Privacy settings saved successfully");
    } catch (error) {
      logger.error("Failed to save privacy settings", error);
      toastBridge.showError?.("Failed to save privacy settings");
    }
  };

  return (
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
            checked={dataCollection}
            onChange={setDataCollection}
          />
          <ToggleSwitch
            label="Account Discoverable"
            description="Allow others to find your account by username"
            checked={accountDiscoverable}
            onChange={setAccountDiscoverable}
          />
          <ToggleSwitch
            label="Show Activity Status"
            description="Let others see when you're active"
            checked={showActivityStatus}
            onChange={setShowActivityStatus}
          />

          <Button
            onClick={handleSave}
            disabled={updatePrivacyMutation.isPending}
            className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-black px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updatePrivacyMutation.isPending && (
              <FaSpinner className="animate-spin" />
            )}
            {updatePrivacyMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <SecuritySettings />
    </div>
  );
};

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

    void fetchSettings();
  }, [user]);

  const tabs = [
    { value: "account", label: "Account", icon: <FaUser /> },
    { value: "display", label: "Display", icon: <FaPalette /> },
    { value: "profile", label: "Profile", icon: <FaGlobe /> },
    { value: "privacy", label: "Privacy", icon: <FaShieldAlt /> },
    { value: "goals", label: "Goals", icon: <FaBullseye /> },
    { value: "sync", label: "Sync", icon: <FaDatabase /> },
    { value: "data", label: "Data", icon: <FaDatabase /> },
  ];

  return (
    <div className="text-nightly-spring-green">
      {loading ? (
        <LoadingState message="Loading settings..." size="lg" />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as SettingsTab)}
          tabs={tabs}
          orientation="vertical"
          className="lg:w-64 p-4"
        >
          <TabsContent value="account">
            <div className="max-w-4xl">
              <AccountSection settings={settings} />
            </div>
          </TabsContent>

          <TabsContent value="display">
            <div className="max-w-4xl">
              <DisplaySection settings={settings} />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="max-w-4xl">
              <ProfileSection settings={settings} />
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="max-w-4xl">
              <PrivacySection settings={settings} />
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="max-w-4xl">
              <GoalsSection settings={settings} />
            </div>
          </TabsContent>

          <TabsContent value="sync">
            <div className="max-w-4xl">
              <SyncSection />
            </div>
          </TabsContent>

          <TabsContent value="data">
            <div className="max-w-4xl">
              <DataSection settings={settings} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SettingsPage;
