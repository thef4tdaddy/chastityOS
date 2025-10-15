import React, { useState } from "react";
import { useAuthState } from "@/contexts";
import { useCreateEvent } from "@/hooks/api/useEvents";
import { useNotificationActions } from "@/stores";
import {
  EventError,
  createEventError,
  EVENT_ERROR_MESSAGES,
} from "../EventErrorDisplay";
import { validateEventForm, createConfetti } from "./utils";

// Custom hook for form submission with enhanced error handling
export const useEventSubmission = (
  formData: {
    type: string;
    notes: string;
    timestamp: string;
    mood: string;
    intensity: number;
    tags: string;
    isPrivate: boolean;
  },
  resetForm: () => void,
  onEventLogged?: () => void,
  targetUserId?: string,
) => {
  const { user } = useAuthState();
  const createEvent = useCreateEvent();
  const { showSuccess, showError } = useNotificationActions();
  const [formError, setFormError] = useState<EventError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleSubmissionError = (error: unknown) => {
    const isOffline = !navigator.onLine;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (isOffline) {
      setFormError(
        createEventError(
          "network",
          EVENT_ERROR_MESSAGES.NETWORK_OFFLINE,
          "Your event will be saved and synced when you're back online",
          false,
        ),
      );
      showSuccess("Event queued for sync", "Will sync when online");
    } else if (errorMessage.includes("timeout")) {
      setFormError(
        createEventError(
          "network",
          EVENT_ERROR_MESSAGES.NETWORK_TIMEOUT,
          "The connection timed out. Your internet may be slow",
          true,
        ),
      );
    } else if (errorMessage.includes("duplicate")) {
      setFormError(
        createEventError(
          "duplicate",
          EVENT_ERROR_MESSAGES.VALIDATION_DUPLICATE,
          "Try adjusting the timestamp or event type",
          false,
        ),
      );
    } else {
      setFormError(
        createEventError(
          "unknown",
          EVENT_ERROR_MESSAGES.NETWORK_ERROR,
          retryCount > 0
            ? `Failed after ${retryCount + 1} attempts. Please check your connection.`
            : undefined,
          true,
        ),
      );
    }

    showError("Failed to log event. Please try again.", "Event Log Failed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormError(null);

    const validationError = validateEventForm(formData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const userId = targetUserId || user.uid;

    try {
      await createEvent.mutateAsync({
        userId,
        type: formData.type as string,
        timestamp: new Date(formData.timestamp),
        notes: formData.notes,
        isPrivate: formData.isPrivate,
        metadata: {
          mood: formData.mood,
          intensity: formData.intensity,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
      });

      showSuccess("Event logged successfully", "Event Added");

      if (formData.type === "milestone") {
        createConfetti();
      }

      setRetryCount(0);
      setFormError(null);
      onEventLogged?.();
      resetForm();
    } catch (error) {
      handleSubmissionError(error);
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setFormError(null);
    void handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const dismissError = () => {
    setFormError(null);
  };

  return {
    handleSubmit,
    isPending: createEvent.isPending,
    formError,
    handleRetry,
    dismissError,
  };
};
