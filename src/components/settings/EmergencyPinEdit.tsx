/**
 * Emergency PIN Edit Component
 * Form for creating or updating emergency PIN
 */
import React from "react";
import { FaShieldAlt, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import { Input, Card } from "@/components/ui";

interface EmergencyPinEditProps {
  hasPin: boolean;
  pin: string;
  setPin: (value: string) => void;
  confirmPin: string;
  setConfirmPin: (value: string) => void;
  error: string;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const EmergencyPinEdit: React.FC<EmergencyPinEditProps> = ({
  hasPin,
  pin,
  setPin,
  confirmPin,
  setConfirmPin,
  error,
  isSaving,
  onSave,
  onCancel,
}) => {
  return (
    <Card variant="glass" padding="lg" className="border-2 border-red-500/30">
      <div className="flex items-center gap-2 mb-4">
        <FaShieldAlt className="text-red-400 text-xl" />
        <h3 className="text-xl font-bold text-nightly-honeydew">
          {hasPin ? "Update Emergency PIN" : "Set Emergency PIN"}
        </h3>
      </div>

      <p className="text-sm text-nightly-celadon mb-6">
        This PIN allows you to emergency unlock during hardcore mode sessions.
        Keep it secure and memorable.
      </p>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Emergency PIN
          </label>
          <Input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter 4+ character PIN"
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500 font-mono"
            disabled={isSaving}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Confirm PIN
          </label>
          <Input
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            placeholder="Re-enter PIN"
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500 font-mono"
            disabled={isSaving}
            autoComplete="new-password"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onSave}
            disabled={isSaving || !pin || !confirmPin}
            className="flex-1 bg-red-500/20 border border-red-500 hover:bg-red-500/30 text-red-400 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FaCheck /> Save PIN
              </>
            )}
          </Button>
          <Button
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 bg-white/5 border border-white/20 hover:bg-white/10 text-nightly-celadon font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FaTimes /> Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};
