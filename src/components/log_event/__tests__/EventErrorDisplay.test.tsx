import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  EventErrorDisplay,
  createEventError,
  EVENT_ERROR_MESSAGES,
} from "../EventErrorDisplay";

describe("EventErrorDisplay", () => {
  it("should not render when error is null", () => {
    const { container } = render(<EventErrorDisplay error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should render error message", () => {
    const error = createEventError(
      "validation",
      "Test error message",
      "Test details",
    );

    render(<EventErrorDisplay error={error} />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.getByText("Test details")).toBeInTheDocument();
  });

  it("should call onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    const error = createEventError("validation", "Test error");

    render(<EventErrorDisplay error={error} onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText("Dismiss error");
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should call onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    const error = createEventError("network", "Test error", undefined, true);

    render(<EventErrorDisplay error={error} onRetry={onRetry} />);

    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should not render details when not provided", () => {
    const error = createEventError("validation", "Test error");

    render(<EventErrorDisplay error={error} />);

    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.queryByText("Test details")).not.toBeInTheDocument();
  });
});

describe("createEventError", () => {
  it("should create error object with correct properties", () => {
    const error = createEventError(
      "validation",
      "Test message",
      "Test details",
      true,
    );

    expect(error).toEqual({
      type: "validation",
      message: "Test message",
      details: "Test details",
      canRetry: true,
    });
  });

  it("should default canRetry to true", () => {
    const error = createEventError("network", "Test message");

    expect(error.canRetry).toBe(true);
  });
});

describe("EVENT_ERROR_MESSAGES", () => {
  it("should have all required error messages", () => {
    expect(EVENT_ERROR_MESSAGES.VALIDATION_REQUIRED_FIELDS).toBeDefined();
    expect(EVENT_ERROR_MESSAGES.VALIDATION_INVALID_DATE).toBeDefined();
    expect(EVENT_ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
    expect(EVENT_ERROR_MESSAGES.UNKNOWN_ERROR).toBeDefined();
  });
});
