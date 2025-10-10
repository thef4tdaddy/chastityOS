import React from "react";
import { FaLock } from "../../utils/iconImport";
import { ToggleSwitch } from "./ToggleSwitch";
import { Button } from "@/components/ui";

export const SecuritySettings: React.FC = () => (
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
        <Select className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew">
          <option value="never">Never</option>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
          <option value="240">4 hours</option>
          <option value="1440">24 hours</option>
        </Select>
      </div>

      <ToggleSwitch
        label="Login Alerts"
        description="Get notified of new logins to your account"
        checked={true}
      />

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
            <Button className="text-red-400 hover:text-red-300 text-xs">
              Remove
            </Button>
          </div>
        </div>
        <Button className="mt-2 text-nightly-aquamarine hover:text-nightly-spring-green text-sm">
          Log out all other devices
        </Button>
      </div>
    </div>
  </div>
);
