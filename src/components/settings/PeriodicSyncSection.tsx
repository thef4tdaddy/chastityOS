/**
 * Periodic Sync Settings Section
 * UI component for managing periodic background sync settings
 */
import React, { useState, useEffect } from "react";
import { usePeriodicSync } from "@/hooks/api/usePeriodicSync";
import { Button, Switch, Tooltip } from "@/components/ui";
import { FaSpinner, FaSync, FaClock, FaBatteryHalf } from "@/utils/iconImport";
import { logger } from "@/utils/logging";
import { toastBridge } from "@/utils/toastBridge";
import { formatDistanceToNow } from "date-fns";

const UnsupportedMessage: React.FC = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
    <div className="flex items-center gap-3 mb-4">
      <FaSync className="text-yellow-400" />
      <h3 className="text-lg font-semibold text-nightly-honeydew">
        Periodic Background Sync
      </h3>
    </div>
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
      <p className="text-sm text-yellow-300">
        Periodic background sync is not supported in your browser. This feature
        requires a modern browser with PWA support.
      </p>
    </div>
  </div>
);

const DataRefreshedList: React.FC = () => (
  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
    <h4 className="text-sm font-semibold text-blue-300 mb-2">Data Refreshed</h4>
    <ul className="text-xs text-blue-200/80 space-y-1">
      <li>✓ Active session status</li>
      <li>✓ Pending tasks from keyholder</li>
      <li>✓ Unread notifications</li>
      <li>✓ Recent events</li>
      <li>✓ Badge count updates</li>
    </ul>
  </div>
);

export const PeriodicSyncSection: React.FC = () => {
  const { settings, isSupported, lastSyncTime, updateSettings } =
    usePeriodicSync();

  const [enabled, setEnabled] = useState(settings.enabled);
  const [batteryAware, setBatteryAware] = useState(settings.batteryAware);
  const [intervalMinutes, setIntervalMinutes] = useState(
    settings.intervalMinutes,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when settings change
  useEffect(() => {
    setEnabled(settings.enabled);
    setBatteryAware(settings.batteryAware);
    setIntervalMinutes(settings.intervalMinutes);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        enabled,
        batteryAware,
        intervalMinutes,
      });
      toastBridge.showSuccess?.("Periodic sync settings saved successfully");
    } catch (error) {
      logger.error("Failed to save periodic sync settings", error);
      toastBridge.showError?.("Failed to save periodic sync settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSupported) {
    return <UnsupportedMessage />;
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaSync className="text-nightly-aquamarine" />
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Periodic Background Sync
        </h3>
      </div>

      <div className="space-y-4">
        {/* Description */}
        <p className="text-sm text-nightly-celadon/80">
          Automatically refresh your app data in the background every{" "}
          {intervalMinutes} minutes, even when the app is closed.
        </p>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div>
              <div className="text-sm font-medium text-nightly-celadon">
                Enable Periodic Sync
              </div>
              <div className="text-xs text-nightly-celadon/70">
                Automatically refresh data in the background
              </div>
            </div>
            <Tooltip content="When enabled, the app will refresh your data every 15 minutes while closed">
              <span className="text-nightly-aquamarine/60 cursor-help text-xs">
                ⓘ
              </span>
            </Tooltip>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Sync Interval */}
        <div className="py-3 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <FaClock className="text-nightly-celadon" />
            <div className="text-sm font-medium text-nightly-celadon">
              Sync Interval
            </div>
            <Tooltip content="Minimum interval is 15 minutes, enforced by the browser">
              <span className="text-nightly-aquamarine/60 cursor-help text-xs">
                ⓘ
              </span>
            </Tooltip>
          </div>
          <div className="text-xs text-nightly-celadon/70 mb-2">
            Data will be refreshed every {intervalMinutes} minutes
          </div>
          <div className="text-xs text-yellow-300/80">
            Note: Browser enforces a minimum of 15 minutes
          </div>
        </div>

        {/* Battery-Aware Syncing */}
        <div className="flex items-center justify-between py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FaBatteryHalf className="text-nightly-celadon" />
            <div>
              <div className="text-sm font-medium text-nightly-celadon">
                Battery-Aware Syncing
              </div>
              <div className="text-xs text-nightly-celadon/70">
                Pause syncing when battery is low
              </div>
            </div>
            <Tooltip content="Syncing will be paused when battery is below 20% and not charging">
              <span className="text-nightly-aquamarine/60 cursor-help text-xs">
                ⓘ
              </span>
            </Tooltip>
          </div>
          <Switch checked={batteryAware} onCheckedChange={setBatteryAware} />
        </div>

        {/* Last Sync Time */}
        {lastSyncTime && (
          <div className="py-3 border-b border-white/10">
            <div className="text-sm font-medium text-nightly-celadon mb-1">
              Last Sync
            </div>
            <div className="text-xs text-nightly-celadon/70">
              {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}
            </div>
          </div>
        )}

        {/* Data Refreshed */}
        <DataRefreshedList />

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <FaSpinner className="animate-spin" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
