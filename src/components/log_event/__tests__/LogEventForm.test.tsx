/**
 * LogEventForm Component Tests
 * Tests for the event logging form including validation, submission, and error handling
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogEventForm } from "../LogEventForm";
import * as AuthContext from "../../../contexts/AuthContext";
import * as useEventsHook from "../../../hooks/api/useEvents";
import * as notificationStore from "../../../stores/notificationStore";

// Mock dependencies
vi.mock("../../../contexts/AuthContext");
vi.mock("../../../hooks/api/useEvents");
vi.mock("../../../stores/notificationStore");

describe("LogEventForm", () => {
  const mockUser = { uid: "test-user-id", displayName: "Test User" };
  const mockCreateEvent = vi.fn();
  const mockShowSuccess = vi.fn();
  const mockShowError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth context
    vi.mocked(AuthContext.useAuthState).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    });

    // Mock useCreateEvent hook
    vi.mocked(useEventsHook.useCreateEvent).mockReturnValue({
      mutateAsync: mockCreateEvent,
      isPending: false,
      isError: false,
      error: null,
      isSuccess: false,
      data: undefined,
      mutate: vi.fn(),
      reset: vi.fn(),
    } as any);

    // Mock notification store
    vi.mocked(notificationStore.useNotificationActions).mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showInfo: vi.fn(),
      showWarning: vi.fn(),
    });

    mockCreateEvent.mockResolvedValue({});
  });

  describe("Form Rendering", () => {
    it("should render the form with all required fields", () => {
      render(<LogEventForm />);

      // Check for heading
      expect(screen.getByText("Log New Event")).toBeInTheDocument();

      // Check for event type selector
      expect(screen.getByText("Orgasm")).toBeInTheDocument();
      expect(screen.getByText("Sexual Activity")).toBeInTheDocument();
      expect(screen.getByText("Milestone")).toBeInTheDocument();
      expect(screen.getByText("Note")).toBeInTheDocument();

      // Check for basic form fields
      expect(screen.getByLabelText(/date.*time/i)).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: /notes/i }),
      ).toBeInTheDocument();

      // Check for advanced fields
      expect(screen.getByLabelText(/mood/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/intensity/i)).toBeInTheDocument();

      // Check for tags and privacy
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/private/i)).toBeInTheDocument();

      // Check for submit button
      expect(screen.getByText(/log event/i)).toBeInTheDocument();
    });

    it("should have proper accessibility attributes", () => {
      render(<LogEventForm />);

      // Check for region landmark
      const region = screen.getByRole("region");
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute("aria-labelledby", "log-event-heading");

      // Check event type group
      const eventTypeGroup = screen.getByRole("group", {
        name: /event type/i,
      });
      expect(eventTypeGroup).toBeInTheDocument();
    });

    it("should render with default values", () => {
      render(<LogEventForm />);

      // Note should be selected by default (4th button)
      const noteButton = screen.getByRole("button", {
        name: /note.*general note/i,
      });
      expect(noteButton).toHaveAttribute("aria-pressed", "true");

      // Timestamp should have a default value
      const timestampInput = screen.getByLabelText(/date.*time/i);
      expect(timestampInput).toHaveValue();

      // Notes should be empty
      const notesInput = screen.getByRole("textbox", { name: /notes/i });
      expect(notesInput).toHaveValue("");

      // Intensity should default to 5
      const intensitySlider = screen.getByLabelText(/intensity level/i);
      expect(intensitySlider).toHaveValue("5");

      // Privacy should be off by default (Switch is implemented as checkbox)
      const privacyCheckbox = screen.getByRole("checkbox", {
        name: /private/i,
      });
      expect(privacyCheckbox).not.toBeChecked();
    });
  });

  describe("Event Type Selection", () => {
    it("should allow selecting different event types", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      // Click orgasm button
      const orgasmButton = screen.getByRole("button", {
        name: /orgasm.*self or partner/i,
      });
      await user.click(orgasmButton);

      expect(orgasmButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should show visual feedback for selected event type", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const sexualActivityButton = screen.getByRole("button", {
        name: /sexual activity/i,
      });

      await user.click(sexualActivityButton);

      expect(sexualActivityButton).toHaveAttribute("aria-pressed", "true");
      expect(sexualActivityButton).toHaveClass(/aquamarine/);
    });

    it("should allow changing event type selection", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      // Initially note is selected
      const noteButton = screen.getByRole("button", { name: /note/i });
      expect(noteButton).toHaveAttribute("aria-pressed", "true");

      // Select milestone
      const milestoneButton = screen.getByRole("button", {
        name: /milestone/i,
      });
      await user.click(milestoneButton);

      expect(milestoneButton).toHaveAttribute("aria-pressed", "true");
      expect(noteButton).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("Form Validation", () => {
    it("should validate invalid timestamp", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const timestampInput = screen.getByLabelText(/date.*time/i);

      // Set invalid date
      await user.clear(timestampInput);
      await user.type(timestampInput, "invalid-date");

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      // Form should not submit
      await waitFor(() => {
        expect(mockCreateEvent).not.toHaveBeenCalled();
      });
    });

    it("should show error for future date", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const timestampInput = screen.getByLabelText(/date.*time/i);

      // Set future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureISOString = futureDate.toISOString().slice(0, 16);

      await user.clear(timestampInput);
      await user.type(timestampInput, futureISOString);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      // Check for validation error
      await waitFor(() => {
        expect(
          screen.getByText(
            /events can only be logged for past or current times/i,
          ),
        ).toBeInTheDocument();
      });

      expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    it("should validate notes length", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const notesInput = screen.getByRole("textbox", { name: /notes/i });

      // Create a very long note (over 5000 characters)
      const longNote = "a".repeat(5001);
      // Use fireEvent to directly set value instead of typing (much faster)
      fireEvent.change(notesInput, { target: { value: longNote } });

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText(/notes are too long/i)).toBeInTheDocument();
      });

      expect(mockCreateEvent).not.toHaveBeenCalled();
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      // Fill in form
      const notesInput = screen.getByRole("textbox", { name: /notes/i });
      await user.type(notesInput, "Test event notes");

      const moodInput = screen.getByRole("textbox", { name: /mood/i });
      await user.type(moodInput, "Happy");

      const tagsInput = screen.getByRole("textbox", { name: /tags/i });
      await user.type(tagsInput, "test, example");

      // Submit form
      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      // Wait for submission
      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: mockUser.uid,
            type: "note",
            notes: "Test event notes",
            isPrivate: false,
            metadata: expect.objectContaining({
              mood: "Happy",
              intensity: 5,
              tags: ["test", "example"],
            }),
          }),
        );
      });

      // Check success notification
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Event logged successfully",
        "Event Added",
      );
    });

    it("should reset form after successful submission", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const notesInput = screen.getByRole("textbox", { name: /notes/i });
      await user.type(notesInput, "Test notes");

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalled();
      });

      // Form should be reset
      await waitFor(() => {
        expect(notesInput).toHaveValue("");
      });
    });

    it("should call onEventLogged callback after successful submission", async () => {
      const user = userEvent.setup();
      const onEventLogged = vi.fn();
      render(<LogEventForm onEventLogged={onEventLogged} />);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(onEventLogged).toHaveBeenCalled();
      });
    });

    it("should log event for targetUserId when provided", async () => {
      const user = userEvent.setup();
      const targetUserId = "other-user-id";
      render(<LogEventForm targetUserId={targetUserId} />);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: targetUserId,
          }),
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should display network error", async () => {
      const user = userEvent.setup();
      mockCreateEvent.mockRejectedValueOnce(
        new Error("Failed to connect to server"),
      );

      render(<LogEventForm />);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save event/i)).toBeInTheDocument();
      });

      expect(mockShowError).toHaveBeenCalledWith(
        "Failed to log event. Please try again.",
        "Event Log Failed",
      );
    });

    it("should handle offline error gracefully", async () => {
      const user = userEvent.setup();

      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      mockCreateEvent.mockRejectedValueOnce(new Error("Network error"));

      render(<LogEventForm />);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/you are currently offline/i),
        ).toBeInTheDocument();
      });

      // Cleanup
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
    });

    it("should show retry button for retriable errors", async () => {
      const user = userEvent.setup();
      mockCreateEvent.mockRejectedValueOnce(new Error("timeout"));

      render(<LogEventForm />);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    it("should retry submission when retry button clicked", async () => {
      const user = userEvent.setup();

      // First submission fails
      mockCreateEvent.mockRejectedValueOnce(new Error("timeout"));

      render(<LogEventForm />);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Second submission succeeds
      mockCreateEvent.mockResolvedValueOnce({});

      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledTimes(2);
      });
    });

    it("should allow dismissing errors", async () => {
      const user = userEvent.setup();
      mockCreateEvent.mockRejectedValueOnce(new Error("Test error"));

      render(<LogEventForm />);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save event/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText(/dismiss error/i);
      await user.click(dismissButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/failed to save event/i),
        ).not.toBeInTheDocument();
      });
    });

    it("should handle duplicate event error", async () => {
      const user = userEvent.setup();
      mockCreateEvent.mockRejectedValueOnce(
        new Error("duplicate event detected"),
      );

      render(<LogEventForm />);

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/similar event already exists/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      // Mock pending state
      vi.mocked(useEventsHook.useCreateEvent).mockReturnValue({
        mutateAsync: mockCreateEvent,
        isPending: true,
        isError: false,
        error: null,
        isSuccess: false,
        data: undefined,
        mutate: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<LogEventForm />);

      const submitButton = screen.getByRole("button", {
        name: /submitting event|logging/i,
      });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute("aria-busy", "true");
    });

    it("should disable form during submission", async () => {
      const user = userEvent.setup();

      vi.mocked(useEventsHook.useCreateEvent).mockReturnValue({
        mutateAsync: mockCreateEvent,
        isPending: true,
        isError: false,
        error: null,
        isSuccess: false,
        data: undefined,
        mutate: vi.fn(),
        reset: vi.fn(),
      } as any);

      render(<LogEventForm />);

      const submitButton = screen.getByRole("button", {
        name: /submitting event|logging/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("User Interactions", () => {
    it("should update mood field on input", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const moodInput = screen.getByRole("textbox", { name: /mood/i });
      await user.type(moodInput, "Excited");

      expect(moodInput).toHaveValue("Excited");
    });

    it("should update intensity slider", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const intensitySlider = screen.getByLabelText(/intensity level/i);
      fireEvent.change(intensitySlider, { target: { value: "8" } });

      expect(intensitySlider).toHaveValue("8");
      expect(screen.getByText("8")).toBeInTheDocument();
    });

    it("should toggle privacy switch", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const privacyCheckbox = screen.getByRole("checkbox", {
        name: /private/i,
      });
      expect(privacyCheckbox).not.toBeChecked();

      await user.click(privacyCheckbox);

      expect(privacyCheckbox).toBeChecked();
    });

    it("should parse tags correctly", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const tagsInput = screen.getByRole("textbox", { name: /tags/i });
      await user.type(tagsInput, "romantic, intense, relaxed");

      const submitButton = screen.getByText(/log event/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              tags: ["romantic", "intense", "relaxed"],
            }),
          }),
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for all interactive elements", () => {
      render(<LogEventForm />);

      // Check button labels
      const orgasmButton = screen.getByRole("button", {
        name: /orgasm.*self or partner/i,
      });
      expect(orgasmButton).toHaveAttribute("aria-label");

      // Check input labels
      const timestampInput = screen.getByLabelText(/date.*time/i);
      expect(timestampInput).toBeInTheDocument();

      // Check slider has proper ARIA attributes
      const intensitySlider = screen.getByLabelText(/intensity level/i);
      expect(intensitySlider).toHaveAttribute("aria-valuenow");
      expect(intensitySlider).toHaveAttribute("aria-valuemin");
      expect(intensitySlider).toHaveAttribute("aria-valuemax");
    });

    it("should announce intensity changes", () => {
      render(<LogEventForm />);

      // Find the intensity value display - it should have aria-live
      const intensityDisplay = screen.getByText("5");
      expect(intensityDisplay).toBeInTheDocument();

      // The element itself should have aria-live and aria-atomic
      expect(intensityDisplay).toHaveAttribute("aria-live", "polite");
      expect(intensityDisplay).toHaveAttribute("aria-atomic", "true");
    });

    it("should have keyboard accessible event type buttons", async () => {
      const user = userEvent.setup();
      render(<LogEventForm />);

      const orgasmButton = screen.getByRole("button", {
        name: /orgasm/i,
      });

      orgasmButton.focus();
      expect(orgasmButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(orgasmButton).toHaveAttribute("aria-pressed", "true");
    });
  });
});
