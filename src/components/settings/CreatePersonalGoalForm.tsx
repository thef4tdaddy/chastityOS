/**
 * Create Personal Goal Form Component
 * Form for creating a new personal chastity duration goal
 */
import React, { useState, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useAuthState } from "../../contexts";
import {
  useSetEmergencyPin,
  useHasEmergencyPin,
} from "../../hooks/api/useEmergencyPin";
import { checkGoogleSignIn } from "../../utils/auth/google-auth-check";
import {
  validateHardcoreMode,
  calculateTotalSeconds,
  validateGoalForm,
} from "../../utils/goals/formValidation";
import { HardcoreModeSection } from "./HardcoreModeSection";
import { GoalFormFields } from "./GoalFormFields";
import { Card } from "@/components/ui";

interface CreatePersonalGoalFormProps {
  onCreate: (
    title: string,
    targetDuration: number,
    description?: string,
  ) => void;
  isCreating: boolean;
}

// eslint-disable-next-line max-lines-per-function -- Component has clear sections and is well-organized
export const CreatePersonalGoalForm: React.FC<CreatePersonalGoalFormProps> = ({
  onCreate,
  isCreating,
}) => {
  const { user } = useAuthState();
  const setEmergencyPinMutation = useSetEmergencyPin();
  const hasEmergencyPin = useHasEmergencyPin(user?.uid);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState(7);
  const [hours, setHours] = useState(0);
  const [description, setDescription] = useState("");

  // Hardcore mode state
  const [isHardcoreMode, setIsHardcoreMode] = useState(false);
  const [emergencyPinInput, setEmergencyPinInput] = useState("");
  const [confirmEmergencyPin, setConfirmEmergencyPin] = useState("");
  const [lockCombination, setLockCombination] = useState("");
  const [saveLockCombination, setSaveLockCombination] = useState(false);
  const [isSignedInWithGoogle, setIsSignedInWithGoogle] = useState(false);
  const [pinError, setPinError] = useState("");

  // Check Google sign-in status
  useEffect(() => {
    const checkGoogleStatus = async () => {
      if (!user?.uid) return;

      const { isSignedInWithGoogle: hasGoogle } = await checkGoogleSignIn();
      setIsSignedInWithGoogle(hasGoogle);
    };

    checkGoogleStatus();
  }, [user?.uid, isOpen]);

  const saveEmergencyPin = async (): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      await setEmergencyPinMutation.mutateAsync({
        userId: user.uid,
        pin: emergencyPinInput,
      });
      return true;
    } catch {
      setPinError("Failed to save emergency PIN");
      return false;
    }
  };

  const resetForm = () => {
    setTitle("");
    setDays(7);
    setHours(0);
    setDescription("");
    setIsHardcoreMode(false);
    setEmergencyPinInput("");
    setConfirmEmergencyPin("");
    setLockCombination("");
    setSaveLockCombination(false);
    setPinError("");
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    const validation = validateGoalForm(title, days, hours);
    if (!validation.isValid) return;

    const totalSeconds = calculateTotalSeconds(days, hours);

    // Validate hardcore mode requirements
    if (isHardcoreMode) {
      const hardcoreValidation = validateHardcoreMode(
        hasEmergencyPin,
        emergencyPinInput,
        confirmEmergencyPin,
        saveLockCombination,
        isSignedInWithGoogle,
      );

      if (!hardcoreValidation.isValid) {
        setPinError(hardcoreValidation.error || "Validation failed");
        return;
      }

      // Save the emergency PIN if needed
      if (!hasEmergencyPin) {
        const saved = await saveEmergencyPin();
        if (!saved) return;
      }
    }

    onCreate(title.trim(), totalSeconds, description.trim() || undefined);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
  };

  if (!isOpen) {
    return (
      <Card
        variant="glass"
        padding="lg"
        onClick={() => setIsOpen(true)}
        className="hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-nightly-aquamarine font-semibold cursor-pointer"
      >
        <FaPlus /> Create Personal Goal
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Create Personal Goal
        </h3>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-nightly-celadon"
        >
          <FaTimes />
        </button>
      </div>

      <div className="space-y-4">
        <GoalFormFields
          title={title}
          setTitle={setTitle}
          days={days}
          setDays={setDays}
          hours={hours}
          setHours={setHours}
          description={description}
          setDescription={setDescription}
          isCreating={isCreating}
        />

        <HardcoreModeSection
          isHardcoreMode={isHardcoreMode}
          setIsHardcoreMode={setIsHardcoreMode}
          hasEmergencyPin={hasEmergencyPin}
          emergencyPinInput={emergencyPinInput}
          setEmergencyPinInput={setEmergencyPinInput}
          confirmEmergencyPin={confirmEmergencyPin}
          setConfirmEmergencyPin={setConfirmEmergencyPin}
          saveLockCombination={saveLockCombination}
          setSaveLockCombination={setSaveLockCombination}
          lockCombination={lockCombination}
          setLockCombination={setLockCombination}
          isSignedInWithGoogle={isSignedInWithGoogle}
          pinError={pinError}
          setPinError={setPinError}
          isCreating={isCreating}
        />

        <button
          onClick={handleSubmit}
          disabled={isCreating || !title.trim() || (days === 0 && hours === 0)}
          className="w-full bg-nightly-aquamarine/20 border border-nightly-aquamarine hover:bg-nightly-aquamarine/30 text-nightly-aquamarine font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCreating ? (
            "Creating..."
          ) : (
            <>
              <FaPlus /> Create Goal
            </>
          )}
        </button>
      </div>
    </Card>
  );
};
