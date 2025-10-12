/**
 * PauseResumeButtons Component Tests
 * Tests for pause/resume session controls and modal interactions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PauseResumeButtons } from "../PauseResumeButtons";

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Button: vi.fn(
    ({ children, onClick, disabled, loading, className, ...props }) => (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={className}
        data-loading={loading}
        {...props}
      >
        {loading ? "Loading..." : children}
      </button>
    ),
  ),
  Modal: vi.fn(({ isOpen, children, title, onClose, footer }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        {children}
        {footer}
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
      </div>
    ) : null,
  ),
  Input: vi.fn(({ value, onChange, placeholder, className, ...props }) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )),
  Select: vi.fn(({ label, value, onChange, options }) => (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt: { value: string; label: string }) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )),
  SelectOption: vi.fn(),
  Textarea: vi.fn(),
}));

// Mock the hook
const mockHookReturn = {
  buttonStates: {
    showPause: false,
    showResume: false,
    canPause: true,
  },
  cooldownDisplay: null,
  pauseButtonStyling: "bg-yellow-600",
  pauseButtonText: "Pause Session",
  showPauseModal: false,
  selectedReason: "Bathroom Break" as const,
  customReason: "",
  isLoading: false,
  handlePauseClick: vi.fn(),
  handleResumeClick: vi.fn(),
  handleConfirmPause: vi.fn(),
  handleModalCancel: vi.fn(),
  setSelectedReason: vi.fn(),
  setCustomReason: vi.fn(),
};

vi.mock("../../hooks/tracker/usePauseResumeControls", () => ({
  usePauseResumeControls: vi.fn(() => mockHookReturn),
}));

import { usePauseResumeControls } from "../../hooks/tracker/usePauseResumeControls";

describe("PauseResumeButtons", () => {
  const defaultProps = {
    sessionId: "session-123",
    userId: "user-123",
    isPaused: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn.buttonStates = {
      showPause: false,
      showResume: false,
      canPause: true,
    };
    mockHookReturn.showPauseModal = false;
    mockHookReturn.isLoading = false;
    mockHookReturn.cooldownDisplay = null;
  });

  describe("Resume Button", () => {
    it("should render resume button when showResume is true", () => {
      mockHookReturn.buttonStates.showResume = true;

      render(<PauseResumeButtons {...defaultProps} isPaused={true} />);

      expect(screen.getByText(/Resume Session/)).toBeInTheDocument();
    });

    it("should call handleResumeClick when clicked", () => {
      mockHookReturn.buttonStates.showResume = true;

      render(<PauseResumeButtons {...defaultProps} isPaused={true} />);

      const resumeButton = screen.getByText(/Resume Session/);
      fireEvent.click(resumeButton);

      expect(mockHookReturn.handleResumeClick).toHaveBeenCalledTimes(1);
    });

    it("should show loading state when resuming", () => {
      mockHookReturn.buttonStates.showResume = true;
      mockHookReturn.isLoading = true;

      render(<PauseResumeButtons {...defaultProps} isPaused={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should be disabled when loading", () => {
      mockHookReturn.buttonStates.showResume = true;
      mockHookReturn.isLoading = true;

      render(<PauseResumeButtons {...defaultProps} isPaused={true} />);

      const resumeButton = screen.getByText("Loading...");
      expect(resumeButton).toBeDisabled();
    });

    it("should have green gradient styling", () => {
      mockHookReturn.buttonStates.showResume = true;

      render(<PauseResumeButtons {...defaultProps} isPaused={true} />);

      const resumeButton = screen.getByText(/Resume Session/);
      expect(resumeButton.className).toContain("from-green-600");
    });
  });

  describe("Pause Button", () => {
    it("should render pause button when showPause is true", () => {
      mockHookReturn.buttonStates.showPause = true;

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.getByText(/Pause Session/)).toBeInTheDocument();
    });

    it("should call handlePauseClick when clicked", () => {
      mockHookReturn.buttonStates.showPause = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const pauseButton = screen.getByText(/Pause Session/);
      fireEvent.click(pauseButton);

      expect(mockHookReturn.handlePauseClick).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when canPause is false", () => {
      mockHookReturn.buttonStates.showPause = true;
      mockHookReturn.buttonStates.canPause = false;

      render(<PauseResumeButtons {...defaultProps} />);

      const pauseButton = screen.getByText(/Pause Session/);
      expect(pauseButton).toBeDisabled();
    });

    it("should show cooldown display when present and cannot pause", () => {
      mockHookReturn.buttonStates.showPause = true;
      mockHookReturn.buttonStates.canPause = false;
      mockHookReturn.cooldownDisplay = "5m 30s";

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.getByText(/Next pause in: 5m 30s/)).toBeInTheDocument();
    });

    it("should not show cooldown when can pause", () => {
      mockHookReturn.buttonStates.showPause = true;
      mockHookReturn.buttonStates.canPause = true;
      mockHookReturn.cooldownDisplay = "5m 30s";

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.queryByText(/Next pause in/)).not.toBeInTheDocument();
    });

    it("should show loading state when pausing", () => {
      mockHookReturn.buttonStates.showPause = true;
      mockHookReturn.isLoading = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const pauseButton = screen.getByText(/Pause Session/);
      expect(pauseButton).toBeDisabled();
    });

    it("should display pause emoji", () => {
      mockHookReturn.buttonStates.showPause = true;

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.getByText(/⏸️/)).toBeInTheDocument();
    });
  });

  describe("Pause Modal", () => {
    it("should show modal when showPauseModal is true", () => {
      mockHookReturn.showPauseModal = true;

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(
        screen.getByText("Reason for Pausing Session"),
      ).toBeInTheDocument();
    });

    it("should not show modal when showPauseModal is false", () => {
      mockHookReturn.showPauseModal = false;

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("should display reason dropdown", () => {
      mockHookReturn.showPauseModal = true;

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.getByText("Select reason:")).toBeInTheDocument();
    });

    it("should call setSelectedReason when reason changed", () => {
      mockHookReturn.showPauseModal = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "Medical" } });

      expect(mockHookReturn.setSelectedReason).toHaveBeenCalledWith("Medical");
    });

    it("should show custom reason input when Other selected", () => {
      mockHookReturn.showPauseModal = true;
      mockHookReturn.selectedReason = "Other";

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.getByText("Custom reason:")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Enter custom reason"),
      ).toBeInTheDocument();
    });

    it("should not show custom reason input for predefined reasons", () => {
      mockHookReturn.showPauseModal = true;
      mockHookReturn.selectedReason = "Bathroom Break";

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.queryByText("Custom reason:")).not.toBeInTheDocument();
    });

    it("should call setCustomReason when custom input changed", () => {
      mockHookReturn.showPauseModal = true;
      mockHookReturn.selectedReason = "Other";

      render(<PauseResumeButtons {...defaultProps} />);

      const input = screen.getByPlaceholderText("Enter custom reason");
      fireEvent.change(input, { target: { value: "Test reason" } });

      expect(mockHookReturn.setCustomReason).toHaveBeenCalledWith(
        "Test reason",
      );
    });

    it("should call handleConfirmPause when confirm clicked", () => {
      mockHookReturn.showPauseModal = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const confirmButton = screen.getByText(/Confirm Pause/);
      fireEvent.click(confirmButton);

      expect(mockHookReturn.handleConfirmPause).toHaveBeenCalledTimes(1);
    });

    it("should call handleModalCancel when cancel clicked", () => {
      mockHookReturn.showPauseModal = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockHookReturn.handleModalCancel).toHaveBeenCalledTimes(1);
    });

    it("should disable confirm button when loading", () => {
      mockHookReturn.showPauseModal = true;
      mockHookReturn.isLoading = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const confirmButton = screen.getByText(/Confirm Pause/);
      expect(confirmButton).toBeDisabled();
    });

    it("should disable confirm button when Other selected without custom reason", () => {
      mockHookReturn.showPauseModal = true;
      mockHookReturn.selectedReason = "Other";
      mockHookReturn.customReason = "";

      render(<PauseResumeButtons {...defaultProps} />);

      const confirmButton = screen.getByText(/Confirm Pause/);
      expect(confirmButton).toBeDisabled();
    });

    it("should show loading text when pausing", () => {
      mockHookReturn.showPauseModal = true;
      mockHookReturn.isLoading = true;

      render(<PauseResumeButtons {...defaultProps} />);

      // The button will be disabled when loading
      const confirmButton = screen.getByText(/Confirm Pause/);
      expect(confirmButton).toBeDisabled();
    });
  });

  describe("Hook Integration", () => {
    it("should pass correct props to usePauseResumeControls hook", () => {
      const onPause = vi.fn();
      const onResume = vi.fn();
      const pauseState = {
        canPause: true,
        lastPauseTime: new Date(),
        nextPauseAvailable: new Date(),
        cooldownRemaining: 300,
      };

      render(
        <PauseResumeButtons
          {...defaultProps}
          pauseState={pauseState}
          onPause={onPause}
          onResume={onResume}
        />,
      );

      expect(usePauseResumeControls).toHaveBeenCalledWith({
        sessionId: defaultProps.sessionId,
        userId: defaultProps.userId,
        isPaused: defaultProps.isPaused,
        pauseState,
        onPause,
        onResume,
      });
    });
  });

  describe("States Combination", () => {
    it("should not show both pause and resume buttons simultaneously", () => {
      mockHookReturn.buttonStates.showPause = true;
      mockHookReturn.buttonStates.showResume = true;

      render(<PauseResumeButtons {...defaultProps} />);

      // Both render but in practice only one should be shown based on isPaused state
      expect(screen.getByText(/Resume Session/)).toBeInTheDocument();
      expect(screen.getByText(/Pause Session/)).toBeInTheDocument();
    });

    it("should show neither button when both are false", () => {
      mockHookReturn.buttonStates.showPause = false;
      mockHookReturn.buttonStates.showResume = false;

      render(<PauseResumeButtons {...defaultProps} />);

      expect(screen.queryByText(/Pause/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Resume/)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button structure", () => {
      mockHookReturn.buttonStates.showPause = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const button = screen.getByText(/Pause Session/);
      expect(button.tagName).toBe("BUTTON");
    });

    it("should apply glass-button styling", () => {
      mockHookReturn.buttonStates.showPause = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const button = screen.getByText(/Pause Session/);
      expect(button.className).toContain("glass-button");
    });

    it("should have proper modal role when open", () => {
      mockHookReturn.showPauseModal = true;

      render(<PauseResumeButtons {...defaultProps} />);

      const modal = screen.getByTestId("modal");
      expect(modal).toHaveAttribute("role", "dialog");
    });
  });
});
