/**
 * Emergency PIN Setup Component
 * Allows users to set/update/remove emergency unlock PIN for hardcore mode
 */
import React, { useState } from "react";
import { useAuthState } from "../../contexts";
import {
  useEmergencyPinStatus,
  useSetEmergencyPin,
  useRemoveEmergencyPin,
} from "../../hooks/api/useEmergencyPin";
import { useToast } from "../../hooks/state/useToast";
import { FaSpinner } from "react-icons/fa";
import { EmergencyPinEdit } from "./EmergencyPinEdit";
import { EmergencyPinDisplay } from "./EmergencyPinDisplay";
import { validateEmergencyPin } from "../../utils/goals/formValidation";
import { Card } from "@/components/ui";

interface EmergencyPinSetupProps {
  isHardcoreMode?: boolean;
}

export const EmergencyPinSetup: React.FC<EmergencyPinSetupProps> = ({
  isHardcoreMode = false,
}) => {
  const { user } = useAuthState();
  const { showWarning } = useToast();

  // Use TanStack Query hooks
  const { data: pinStatus, isLoading } = useEmergencyPinStatus(user?.uid);
  const setEmergencyPin = useSetEmergencyPin();
  const removeEmergencyPin = useRemoveEmergencyPin();

  const hasPin = pinStatus?.exists || false;
  const createdAt = pinStatus?.createdAt;

  const [isEditing, setIsEditing] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePin = async () => {
    if (!user?.uid) return;

    const validation = validateEmergencyPin(pin, confirmPin);
    if (!validation.isValid) {
      setError(validation.error || "Validation failed");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await setEmergencyPin.mutateAsync({ userId: user.uid, pin });

      setSuccess("Emergency PIN saved successfully");
      setIsEditing(false);
      setPin("");
      setConfirmPin("");

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save PIN. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePin = async () => {
    if (!user?.uid) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove your emergency PIN? This is a safety feature for hardcore mode.",
    );

    if (!confirmed) return;

    try {
      setIsSaving(true);
      await removeEmergencyPin.mutateAsync(user.uid);

      setSuccess("Emergency PIN removed");

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to remove PIN. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPin("");
    setConfirmPin("");
    setError("");
  };

  if (isLoading) {
    return (
      <Card variant="glass" padding="lg">
        <div className="flex items-center gap-2 text-nightly-celadon">
          <FaSpinner className="animate-spin" />
          <span>Loading emergency PIN settings...</span>
        </div>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <EmergencyPinEdit
        hasPin={hasPin}
        pin={pin}
        setPin={setPin}
        confirmPin={confirmPin}
        setConfirmPin={setConfirmPin}
        error={error}
        isSaving={isSaving}
        onSave={handleSavePin}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <EmergencyPinDisplay
      hasPin={hasPin}
      createdAt={createdAt}
      isHardcoreMode={isHardcoreMode}
      success={success}
      onEdit={() => setIsEditing(true)}
      onRemove={handleRemovePin}
    />
  );
};
