/**
 * Tracker Accessibility Tests
 *  WCAG AA compliance for the tracker components
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CageOnStats } from "../stats/CageOnStats";
import { CageOffStats } from "../stats/CageOffStats";
import { ActionButtons } from "../ActionButtons";
import { TrackerHeader } from "../TrackerHeader";

// Mock Firebase services
vi.mock("@/services/firebase", () => ({
  getFirestore: vi.fn(() => ({})),
  getFirebaseApp: vi.fn(() => ({})),
}));

// Mock auth service
vi.mock("@/services/auth/auth-service", () => ({
  authService: {
    getCurrentUser: vi.fn(() => null),
    onAuthStateChanged: vi.fn(),
  },
}));

// Mock logging
vi.mock("@/utils/logging", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  serviceLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Card: vi.fn(({ children, className, role, ...props }) => (
    <div data-testid="card" className={className} role={role} {...props}>
      {children}
    </div>
  )),
  Button: vi.fn(
    ({
      children,
      className,
      onClick,
      disabled,
      loading,
      leftIcon,
      ...props
    }) => (
      <button
        data-testid="button"
        className={className}
        onClick={onClick}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon}
        {children}
      </button>
    ),
  ),
  Tooltip: vi.fn(({ children }) => <>{children}</>),
}));

// Mock data for tests
const mockDisplayData = (overrides: Partial<any> = {}) => ({
  effectiveTime: "1h 30m 0s",
  isPaused: false,
  currentPauseDuration: "0s",
  accumulatedPause: "0s",
  totalElapsed: "1h 30m 0s",
  isActive: true,
  timeCageOff: 0,
  totalPauseTime: 0,
  showPauseInfo: false,
  ...overrides,
});

const mockStats = (overrides: Partial<any> = {}) => ({
  topBoxLabel: "Session Started",
  topBoxTimestamp: "1/1/2024, 12:00:00 AM",
  totalElapsedFormatted: "1h 30m 0s",
  currentSessionFormatted: "1h 30m",
  cageOffTimeFormatted: "0s",
  totalChastityTimeFormatted: "1 day",
  totalCageOffTimeFormatted: "0s",
  isCageOn: true,
  ...overrides,
});

// Mock icons
vi.mock("../../utils/iconImport", () => ({
  FaLock: () => <span data-testid="lock-icon">🔒</span>,
}));

describe("Tracker Accessibility", () => {
  describe("CageOnStats - ARIA attributes", () => {
    it("should have proper ARIA labels for timer", () => {
      const displayData = mockDisplayData();
      const stats = mockStats();

      render(<CageOnStats displayData={displayData} stats={stats} />);

      // Check for region role
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Current chastity session timer"),
      );

      // Check for timer role
      const timer = screen.getByRole("timer");
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveAttribute("aria-live", "polite");
      expect(timer).toHaveAttribute("aria-atomic", "true");
    });

    it("should indicate paused status in ARIA label", () => {
      const displayData = mockDisplayData({ isPaused: true });
      const stats = mockStats();

      render(<CageOnStats displayData={displayData} stats={stats} />);

      const region = screen.getByRole("region");
      expect(region).toHaveAttribute(
        "aria-label",
        expect.stringContaining("paused"),
      );
    });

    it("should indicate inactive status in ARIA label", () => {
      const displayData = mockDisplayData({ isActive: false });
      const stats = mockStats({
        isCageOn: false,
        currentSessionFormatted: "0s",
      });

      render(<CageOnStats displayData={displayData} stats={stats} />);

      const region = screen.getByRole("region");
      expect(region).toHaveAttribute(
        "aria-label",
        expect.stringContaining("inactive"),
      );
    });
  });

  describe("CageOffStats - ARIA attributes", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should have proper ARIA labels for cage off timer", () => {
      const displayData = mockDisplayData({
        isActive: false,
        timeCageOff: 300,
      });
      const stats = mockStats({
        isCageOn: false,
        currentSessionFormatted: "0s",
        cageOffTimeFormatted: "5m 0s",
      });

      render(<CageOffStats displayData={displayData} stats={stats} />);

      // Check for region role
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Current cage off time"),
      );

      // Check for timer role
      const timer = screen.getByRole("timer");
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveAttribute("aria-live", "polite");
    });

    it("should have emoji with proper aria-label", () => {
      const displayData = mockDisplayData({
        isActive: false,
        timeCageOff: 300,
      });
      const stats = mockStats({
        isCageOn: false,
        currentSessionFormatted: "0s",
        cageOffTimeFormatted: "5m 0s",
      });

      render(<CageOffStats displayData={displayData} stats={stats} />);

      const emojiSpan = screen.getByRole("img");
      expect(emojiSpan).toHaveAttribute(
        "aria-label",
        expect.stringContaining("indicator"),
      );
    });
  });

  describe("ActionButtons - ARIA attributes", () => {
    it("should have aria-label for start session button", () => {
      render(
        <ActionButtons
          isCageOn={false}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onStartSession={() => {}}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Start chastity session");
    });

    it("should have aria-label for end session button", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onEndSession={() => {}}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "End chastity session");
    });

    it("should have proper aria-label for locked state", () => {
      render(
        <ActionButtons
          isCageOn={true}
          isGoalActive={true}
          isHardcoreGoal={true}
          requiredKeyholderDurationSeconds={0}
          sessionId={undefined}
          userId={undefined}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "aria-label",
        expect.stringContaining("locked"),
      );
    });

    it("should have group role for controls container", () => {
      render(
        <ActionButtons
          isCageOn={false}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
        />,
      );

      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("aria-label", "Chastity session controls");
    });
  });

  describe("TrackerHeader - ARIA attributes", () => {
    it("should have status role for cooldown message", () => {
      render(
        <TrackerHeader
          remainingGoalTime={0}
          keyholderName=""
          savedSubmissivesName=""
          requiredKeyholderDurationSeconds={0}
          isCageOn={true}
          denialCooldownActive={false}
          pauseCooldownMessage="Next pause available in 5m"
        />,
      );

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute("aria-live", "polite");
    });

    it("should have timer role for goal countdown", () => {
      render(
        <TrackerHeader
          remainingGoalTime={3600}
          keyholderName=""
          savedSubmissivesName=""
          requiredKeyholderDurationSeconds={0}
          isCageOn={true}
          denialCooldownActive={false}
          pauseCooldownMessage={null}
        />,
      );

      const timer = screen.getByRole("timer");
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveAttribute("aria-live", "polite");
      expect(timer).toHaveAttribute("aria-atomic", "true");
    });

    it("should have region role for keyholder requirement", () => {
      render(
        <TrackerHeader
          remainingGoalTime={0}
          keyholderName="Master"
          savedSubmissivesName="Sub"
          requiredKeyholderDurationSeconds={86400}
          isCageOn={true}
          denialCooldownActive={false}
          pauseCooldownMessage={null}
        />,
      );

      const regions = screen.getAllByRole("region");
      const keyholderRegion = regions.find((r) =>
        r.getAttribute("aria-label")?.includes("Keyholder requirement"),
      );
      expect(keyholderRegion).toBeInTheDocument();
    });

    it("should have assertive live region for denial cooldown", () => {
      render(
        <TrackerHeader
          remainingGoalTime={0}
          keyholderName=""
          savedSubmissivesName=""
          requiredKeyholderDurationSeconds={0}
          isCageOn={true}
          denialCooldownActive={true}
          pauseCooldownMessage={null}
        />,
      );

      const statuses = screen.getAllByRole("status");
      const denialStatus = statuses.find((s) =>
        s.textContent?.includes("Denial cooldown"),
      );
      expect(denialStatus).toBeInTheDocument();
      expect(denialStatus).toHaveAttribute("aria-live", "assertive");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should have minimum touch target size (44px) for buttons", () => {
      render(
        <ActionButtons
          isCageOn={false}
          isGoalActive={false}
          isHardcoreGoal={false}
          requiredKeyholderDurationSeconds={0}
          onStartSession={() => {}}
        />,
      );

      const button = screen.getByRole("button");
      // Check that the button has the min-h-[44px] class for proper touch targets
      expect(button.className).toContain("min-h-[44px]");
    });
  });

  describe("Live Regions", () => {
    it("should mark timer as aria-live=polite", () => {
      const displayData = mockDisplayData();
      const stats = mockStats();

      render(<CageOnStats displayData={displayData} stats={stats} />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveAttribute("aria-live", "polite");
      expect(timer).toHaveAttribute("aria-atomic", "true");
    });
  });
});
