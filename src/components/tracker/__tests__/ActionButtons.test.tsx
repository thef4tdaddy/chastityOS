/**
 * ActionButtons Component Tests
 * Tests for session start/end controls and emergency unlock functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActionButtons } from "../ActionButtons";

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Button: vi.fn(
    ({
      children,
      onClick,
      disabled,
      loading,
      className,
      leftIcon,
      ...props
    }) => (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={className}
        data-loading={loading}
        {...props}
      >
        {leftIcon}
        {loading ? "Loading..." : children}
      </button>
    ),
  ),
  Tooltip: vi.fn(({ children, content }) => (
    <div data-tooltip={content}>{children}</div>
  )),
}));

// Mock the icon imports
vi.mock("../../utils/iconImport", () => ({
  FaLock: ({ className }: { className?: string }) => (
    <span data-testid="lock-icon" className={className}>
      🔒
    </span>
  ),
}));

// Mock the child components
vi.mock("../EmergencyUnlockButton", () => ({
  EmergencyUnlockButton: vi.fn(({ onEmergencyUnlock, className }) => (
    <button
      data-testid="emergency-unlock-button"
      onClick={onEmergencyUnlock}
      className={className}
    >
      Emergency Unlock
    </button>
  )),
}));

vi.mock("../BegForReleaseButton", () => ({
  BegForReleaseButton: vi.fn(({ className }) => (
    <button data-testid="beg-for-release-button" className={className}>
      Beg for Release
    </button>
  )),
}));

describe("ActionButtons", () => {
  const mockHandlers = {
    onStartSession: vi.fn(),
    onEndSession: vi.fn(),
    onEmergencyUnlock: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Start Session Button", () => {
    it("should render start button when cage is off", () => {
      render(
        <ActionButtons
          isCageOn={false}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onStartSession={mockHandlers.onStartSession}
        />,
      );

      const startButton = screen.getByText("ON");
      expect(startButton).toBeInTheDocument();
      expect(startButton).not.toBeDisabled();
    });

    it("should call onStartSession when start button is clicked", () => {
      render(
        <ActionButtons
          isCageOn={false}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onStartSession={mockHandlers.onStartSession}
        />,
      );

      const startButton = screen.getByText("ON");
      fireEvent.click(startButton);

      expect(mockHandlers.onStartSession).toHaveBeenCalledTimes(1);
    });

    it("should show loading state when starting session", () => {
      render(
        <ActionButtons
          isCageOn={false}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onStartSession={mockHandlers.onStartSession}
          isStarting={true}
        />,
      );

      const button = screen.getByText("Loading...");
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe("End Session Button", () => {
    it("should render end button when cage is on and no restrictions", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onEndSession={mockHandlers.onEndSession}
        />,
      );

      const endButton = screen.getByText("OFF");
      expect(endButton).toBeInTheDocument();
      expect(endButton).not.toBeDisabled();
    });

    it("should call onEndSession when end button is clicked", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onEndSession={mockHandlers.onEndSession}
        />,
      );

      const endButton = screen.getByText("OFF");
      fireEvent.click(endButton);

      expect(mockHandlers.onEndSession).toHaveBeenCalledTimes(1);
    });

    it("should show loading state when ending session", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onEndSession={mockHandlers.onEndSession}
          isEnding={true}
        />,
      );

      const button = screen.getByText("Loading...");
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe("Hardcore Goal Emergency Unlock", () => {
    it("should render emergency unlock button for hardcore goal with session info", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={true}
          isHardcoreGoal={true}
          requiredKeyholderDurationSeconds={0}
          sessionId="session-123"
          userId="user-123"
          onEmergencyUnlock={mockHandlers.onEmergencyUnlock}
        />,
      );

      const emergencyButton = screen.getByTestId("emergency-unlock-button");
      expect(emergencyButton).toBeInTheDocument();
    });

    it("should show locked button for hardcore goal without session info", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={true}
          isHardcoreGoal={true}
          requiredKeyholderDurationSeconds={0}
        />,
      );

      const lockedButton = screen.getByText("Locked by Goal");
      expect(lockedButton).toBeInTheDocument();
      expect(lockedButton).toBeDisabled();
      expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    });

    it("should have emergency unlock button wrapped in tooltip", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={true}
          isHardcoreGoal={true}
          requiredKeyholderDurationSeconds={0}
          sessionId="session-123"
          userId="user-123"
          onEmergencyUnlock={mockHandlers.onEmergencyUnlock}
        />,
      );

      const tooltip = screen
        .getByTestId("emergency-unlock-button")
        .closest("[data-tooltip]");
      expect(tooltip).toHaveAttribute(
        "data-tooltip",
        "Emergency unlock is available for urgent situations only. PIN required for hardcore mode.",
      );
    });
  });

  describe("Keyholder Release Request", () => {
    it("should render beg for release button when keyholder requirement is active", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={3600}
          sessionId="session-123"
          userId="user-123"
          keyholderUserId="keyholder-123"
        />,
      );

      const begButton = screen.getByTestId("beg-for-release-button");
      expect(begButton).toBeInTheDocument();
    });

    it("should show locked button when keyholder required but no session info", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={3600}
        />,
      );

      const lockedButton = screen.getByText("Keyholder Required");
      expect(lockedButton).toBeInTheDocument();
      expect(lockedButton).toBeDisabled();
      expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    });

    it("should have beg for release button wrapped in tooltip", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={3600}
          sessionId="session-123"
          userId="user-123"
          keyholderUserId="keyholder-123"
        />,
      );

      const tooltip = screen
        .getByTestId("beg-for-release-button")
        .closest("[data-tooltip]");
      expect(tooltip).toHaveAttribute(
        "data-tooltip",
        "Request early release from your keyholder. They will review and approve or deny your request.",
      );
    });
  });

  describe("Button States Priority", () => {
    it("should prioritize hardcore goal over keyholder requirement", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={true}
          isHardcoreGoal={true}
          requiredKeyholderDurationSeconds={3600}
          sessionId="session-123"
          userId="user-123"
          keyholderUserId="keyholder-123"
        />,
      );

      expect(screen.getByTestId("emergency-unlock-button")).toBeInTheDocument();
      expect(
        screen.queryByTestId("beg-for-release-button"),
      ).not.toBeInTheDocument();
    });

    it("should show keyholder requirement when no goal active", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={3600}
          sessionId="session-123"
          userId="user-123"
          keyholderUserId="keyholder-123"
        />,
      );

      expect(screen.getByTestId("beg-for-release-button")).toBeInTheDocument();
      expect(
        screen.queryByTestId("emergency-unlock-button"),
      ).not.toBeInTheDocument();
    });

    it("should show normal OFF button when no restrictions", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onEndSession={mockHandlers.onEndSession}
        />,
      );

      expect(screen.getByText("OFF")).toBeInTheDocument();
      expect(
        screen.queryByTestId("emergency-unlock-button"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("beg-for-release-button"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button structure", () => {
      render(
        <ActionButtons
          isCageOn={false}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onStartSession={mockHandlers.onStartSession}
        />,
      );

      const button = screen.getByText("ON");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should apply glass-button styling class", () => {
      render(
        <ActionButtons
          isCageOn={false}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onStartSession={mockHandlers.onStartSession}
        />,
      );

      const button = screen.getByText("ON");
      expect(button.className).toContain("glass-button");
    });
  });
});
