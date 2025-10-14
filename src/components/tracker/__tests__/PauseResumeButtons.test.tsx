/**
 * PauseResumeButtons Component Tests
 * Tests for pause/resume session controls and modal interactions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PauseResumeButtons } from "../PauseResumeButtons";
import {
  usePauseResumeControls,
  UsePauseResumeControlsReturn,
} from "@/hooks/tracker/usePauseResumeControls";

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Button: vi.fn(
    ({ children, onClick, disabled, loading, className, ...props }) => (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={className}
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
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
  ),
  Input: vi.fn((props) => <input {...props} />),
  Select: vi.fn(({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      role="combobox"
    >
      {options.map((opt: { value: string; label: string }) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )),
}));

// Mock the hook
const mockHookReturn: UsePauseResumeControlsReturn = {
  isPaused: false,
  canPause: true,
  cooldownRemaining: 0,
  showPauseModal: false,
  selectedReason: "Bathroom Break",
  customReason: "",
  isLoading: false,
  handlePauseClick: vi.fn(),
  handleResumeClick: vi.fn(),
  handleConfirmPause: vi.fn(),
  handleModalCancel: vi.fn(),
  setSelectedReason: vi.fn(),
  setCustomReason: vi.fn(),
  buttonStates: {
    showPause: true,
    showResume: false,
    canPause: true,
    showCooldown: false,
  },
  cooldownDisplay: "",
  pauseButtonStyling: "bg-yellow-600",
  pauseButtonText: "Pause Session",
};

vi.mock("@/hooks/tracker/usePauseResumeControls", () => ({
  usePauseResumeControls: vi.fn(() => mockHookReturn),
}));

describe("PauseResumeButtons", () => {
  const defaultProps = {
    sessionId: "session-123",
    userId: "user-123",
    isPaused: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state before each test
    Object.assign(mockHookReturn, {
      isPaused: false,
      canPause: true,
      cooldownRemaining: 0,
      showPauseModal: false,
      selectedReason: "Bathroom Break",
      customReason: "",
      isLoading: false,
      buttonStates: {
        showPause: true,
        showResume: false,
        canPause: true,
        showCooldown: false,
      },
      cooldownDisplay: "",
    });
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
      fireEvent.click(screen.getByText(/Resume Session/));
      expect(mockHookReturn.handleResumeClick).toHaveBeenCalledTimes(1);
    });

    it("should show loading state when resuming", () => {
      mockHookReturn.buttonStates.showResume = true;
      mockHookReturn.isLoading = true;
      render(<PauseResumeButtons {...defaultProps} isPaused={true} />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
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
      fireEvent.click(screen.getByText(/Pause Session/));
      expect(mockHookReturn.handlePauseClick).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when canPause is false", () => {
      mockHookReturn.buttonStates.canPause = false;
      render(<PauseResumeButtons {...defaultProps} />);
      expect(screen.getByText(/Pause Session/)).toBeDisabled();
    });

    it("should show cooldown display when present and cannot pause", () => {
      mockHookReturn.buttonStates.canPause = false;
      mockHookReturn.buttonStates.showCooldown = true;
      mockHookReturn.cooldownDisplay = "5m 30s";
      render(<PauseResumeButtons {...defaultProps} />);
      expect(screen.getByText(/Next pause in: 5m 30s/)).toBeInTheDocument();
    });
  });

  describe("Pause Modal", () => {
    it("should show modal when showPauseModal is true", () => {
      mockHookReturn.showPauseModal = true;
      render(<PauseResumeButtons {...defaultProps} />);
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    it("should call setSelectedReason when reason changed", () => {
      mockHookReturn.showPauseModal = true;
      render(<PauseResumeButtons {...defaultProps} />);
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Medical" },
      });
      expect(mockHookReturn.setSelectedReason).toHaveBeenCalledWith("Medical");
    });

    it("should show custom reason input when Other selected", () => {
      mockHookReturn.showPauseModal = true;
      mockHookReturn.selectedReason = "Other";
      render(<PauseResumeButtons {...defaultProps} />);
      expect(
        screen.getByPlaceholderText("Enter custom reason"),
      ).toBeInTheDocument();
    });

    it("should call handleConfirmPause when confirm clicked", () => {
      mockHookReturn.showPauseModal = true;
      render(<PauseResumeButtons {...defaultProps} />);
      fireEvent.click(screen.getByText(/Confirm Pause/));
      expect(mockHookReturn.handleConfirmPause).toHaveBeenCalledTimes(1);
    });

    it("should disable confirm button when Other selected without custom reason", () => {
      mockHookReturn.showPauseModal = true;
      mockHookReturn.selectedReason = "Other";
      mockHookReturn.customReason = "";
      render(<PauseResumeButtons {...defaultProps} />);
      expect(screen.getByText(/Confirm Pause/)).toBeDisabled();
    });
  });

  describe("Hook Integration", () => {
    it("should pass correct props to usePauseResumeControls hook", () => {
      const onPause = vi.fn();
      const onResume = vi.fn();
      const pauseState = { canPause: true, cooldownRemaining: 300 };

      render(
        <PauseResumeButtons
          {...defaultProps}
          pauseState={pauseState as any}
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
});
