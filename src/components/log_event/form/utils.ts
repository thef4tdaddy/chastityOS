import {
  EventError,
  createEventError,
  EVENT_ERROR_MESSAGES,
} from "../EventErrorDisplay";

export const createConfetti = () => {
  const colors = ["#22c55e", "#10b981", "#84cc16", "#eab308", "#f59e0b"];
  const confettiCount = 30;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti-particle";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.top = "-10px";
    confetti.style.width = Math.random() * 10 + 5 + "px";
    confetti.style.height = Math.random() * 10 + 5 + "px";
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)] || "#22c55e";
    confetti.style.animationDelay = Math.random() * 0.5 + "s";
    confetti.style.animationDuration = Math.random() * 2 + 2 + "s";

    document.body.appendChild(confetti);

    // Remove confetti after animation completes
    setTimeout(() => {
      confetti.remove();
    }, 3500);
  }
};

// Validation helper
export const validateEventForm = (formData: {
  type: string;
  timestamp: string;
  notes: string;
}): EventError | null => {
  // Check if timestamp is valid
  const timestamp = new Date(formData.timestamp);
  if (isNaN(timestamp.getTime())) {
    return createEventError(
      "validation",
      EVENT_ERROR_MESSAGES.VALIDATION_INVALID_DATE,
      "Please select a valid date and time for the event",
    );
  }

  // Check if timestamp is in the future
  const now = new Date();
  if (timestamp > now) {
    return createEventError(
      "timestamp",
      EVENT_ERROR_MESSAGES.VALIDATION_FUTURE_DATE,
      "Events can only be logged for past or current times",
    );
  }

  // Check if notes are too long (optional validation)
  if (formData.notes && formData.notes.length > 5000) {
    return createEventError(
      "validation",
      "Notes are too long",
      "Please keep notes under 5000 characters",
    );
  }

  return null;
};
