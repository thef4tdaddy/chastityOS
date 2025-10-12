/**
 * SessionLoader Component Tests
 * Tests for loading states and session restoration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SessionLoader } from "../SessionLoader";

// Mock the UI components
vi.mock("@/components/ui", () => ({
  LoadingState: vi.fn(({ message, children, fullScreen }) => (
    <div data-testid="loading-state" data-fullscreen={fullScreen}>
      <p>{message}</p>
      {children}
    </div>
  )),
  Button: vi.fn(({ children, onClick, className }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  )),
}));

// Mock the icon
vi.mock("../../utils/iconImport", () => ({
  FaExclamationTriangle: () => <span data-testid="warning-icon">⚠️</span>,
}));

// Mock the hook
const mockLoadSession = vi.fn();
const mockHookReturn = {
  loadSession: mockLoadSession,
  isLoading: false,
  error: null,
  progress: 0,
  session: null,
};

vi.mock("../../hooks/session/useSessionLoader", () => ({
  useSessionLoader: vi.fn(() => mockHookReturn),
}));

describe("SessionLoader", () => {
  const mockOnSessionRestored = vi.fn();
  const mockOnInitialized = vi.fn();

  const defaultProps = {
    userId: "user-123",
    onSessionRestored: mockOnSessionRestored,
    onInitialized: mockOnInitialized,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn.isLoading = false;
    mockHookReturn.error = null;
    mockHookReturn.progress = 0;
    mockHookReturn.session = null;
  });

  describe("Loading State", () => {
    it("should show loading state when loading", () => {
      mockHookReturn.isLoading = true;

      render(<SessionLoader {...defaultProps} />);

      expect(screen.getByTestId("loading-state")).toBeInTheDocument();
      expect(screen.getByText("Loading Session...")).toBeInTheDocument();
    });

    it("should show progress bar when progress > 0", () => {
      mockHookReturn.isLoading = true;
      mockHookReturn.progress = 50;

      const { container } = render(<SessionLoader {...defaultProps} />);

      const progressBar = container.querySelector(
        ".bg-purple-500",
      ) as HTMLElement;
      expect(progressBar).toBeInTheDocument();
      expect(progressBar.style.width).toBe("50%");
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should not show progress bar when progress is 0", () => {
      // Reset all properties explicitly
      Object.assign(mockHookReturn, {
        isLoading: true,
        error: null,
        progress: 0,
        session: null,
      });

      const { container } = render(<SessionLoader {...defaultProps} />);

      expect(container.querySelector(".bg-purple-500")).not.toBeInTheDocument();
    });

    it("should set fullScreen prop on LoadingState", () => {
      mockHookReturn.isLoading = true;

      render(<SessionLoader {...defaultProps} />);

      const loadingState = screen.getByTestId("loading-state");
      expect(loadingState).toHaveAttribute("data-fullscreen", "true");
    });

    it("should update progress dynamically", () => {
      // Reset and set initial state
      Object.assign(mockHookReturn, {
        isLoading: true,
        error: null,
        progress: 25,
        session: null,
      });

      const { rerender, container } = render(
        <SessionLoader {...defaultProps} />,
      );

      let progressBar = container.querySelector(
        ".bg-purple-500",
      ) as HTMLElement;
      expect(progressBar.style.width).toBe("25%");

      // Update progress
      Object.assign(mockHookReturn, {
        isLoading: true,
        error: null,
        progress: 75,
        session: null,
      });
      rerender(<SessionLoader {...defaultProps} />);

      progressBar = container.querySelector(".bg-purple-500") as HTMLElement;
      expect(progressBar.style.width).toBe("75%");
    });
  });

  describe("Error State", () => {
    it("should show error message when error occurs", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: "Failed to load session",
        progress: 0,
        session: null,
      });

      render(<SessionLoader {...defaultProps} />);

      expect(
        screen.getByText("Session Restoration Failed"),
      ).toBeInTheDocument();
      expect(screen.getByText("Failed to load session")).toBeInTheDocument();
    });

    it("should show warning icon in error state", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: "Failed to load session",
        progress: 0,
        session: null,
      });

      render(<SessionLoader {...defaultProps} />);

      expect(screen.getByTestId("warning-icon")).toBeInTheDocument();
    });

    it("should show reload button in error state", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: "Failed to load session",
        progress: 0,
        session: null,
      });

      render(<SessionLoader {...defaultProps} />);

      expect(screen.getByText("Reload App")).toBeInTheDocument();
    });

    it("should apply error styling", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: "Failed to load session",
        progress: 0,
        session: null,
      });

      const { container } = render(<SessionLoader {...defaultProps} />);

      const errorContainer = container.querySelector(".bg-red-900\\/50");
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveClass("border-red-500");
    });

    it("should reload page when reload button clicked", () => {
      mockHookReturn.error = "Failed to load session";
      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: reloadMock },
        writable: true,
      });

      render(<SessionLoader {...defaultProps} />);

      const reloadButton = screen.getByText("Reload App");
      reloadButton.click();

      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Session Initialization", () => {
    it("should call loadSession on mount with userId", async () => {
      render(<SessionLoader {...defaultProps} />);

      await waitFor(() => {
        expect(mockLoadSession).toHaveBeenCalledWith("user-123");
      });
    });

    it("should call onInitialized after loading session", async () => {
      render(<SessionLoader {...defaultProps} />);

      await waitFor(() => {
        expect(mockOnInitialized).toHaveBeenCalledTimes(1);
      });
    });

    it("should not call loadSession when userId is empty", () => {
      render(<SessionLoader {...defaultProps} userId="" />);

      // Wait a bit to ensure it's not called
      expect(mockLoadSession).not.toHaveBeenCalled();
    });
  });

  describe("Session Restoration Callback", () => {
    it("should call onSessionRestored when session is loaded", async () => {
      mockHookReturn.session = {
        id: "session-123",
        userId: "user-123",
        isCageOn: true,
      };

      render(<SessionLoader {...defaultProps} />);

      await waitFor(() => {
        expect(mockOnSessionRestored).toHaveBeenCalledWith({
          success: true,
          wasRestored: true,
        });
      });
    });

    it("should not call onSessionRestored when no session", () => {
      mockHookReturn.session = null;

      render(<SessionLoader {...defaultProps} />);

      expect(mockOnSessionRestored).not.toHaveBeenCalled();
    });
  });

  describe("Rendering", () => {
    it("should render nothing when not loading and no error", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: null,
        progress: 0,
        session: null,
      });

      const { container } = render(<SessionLoader {...defaultProps} />);

      // Component returns null when not loading and no error
      expect(container.firstChild).toBeNull();
    });

    it("should show error state when there is an error", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: "Test error",
        progress: 0,
        session: null,
      });

      render(<SessionLoader {...defaultProps} />);

      // Error should be shown immediately
      expect(
        screen.getByText("Session Restoration Failed"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Loading Session...")).not.toBeInTheDocument();
    });
  });

  describe("Progress Bar Styling", () => {
    it("should apply correct styling to progress bar container", () => {
      mockHookReturn.isLoading = true;
      mockHookReturn.progress = 50;

      const { container } = render(<SessionLoader {...defaultProps} />);

      const progressContainer = container.querySelector(".bg-gray-700");
      expect(progressContainer).toBeInTheDocument();
      expect(progressContainer).toHaveClass("rounded-full");
      expect(progressContainer).toHaveClass("h-2");
    });

    it("should apply transition class to progress bar", () => {
      mockHookReturn.isLoading = true;
      mockHookReturn.progress = 50;

      const { container } = render(<SessionLoader {...defaultProps} />);

      const progressBar = container.querySelector(".bg-purple-500");
      expect(progressBar).toHaveClass("transition-all");
      expect(progressBar).toHaveClass("duration-300");
    });
  });

  describe("Error Message Display", () => {
    it("should display custom error messages", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: "Network connection failed",
        progress: 0,
        session: null,
      });

      render(<SessionLoader {...defaultProps} />);

      expect(screen.getByText("Network connection failed")).toBeInTheDocument();
    });

    it("should display long error messages", () => {
      const longError =
        "This is a very long error message that should still be displayed correctly in the error state";
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: longError,
        progress: 0,
        session: null,
      });

      render(<SessionLoader {...defaultProps} />);

      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper structure in error state", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: "Test error",
        progress: 0,
        session: null,
      });

      const { container } = render(<SessionLoader {...defaultProps} />);

      const heading = screen.getByText("Session Restoration Failed");
      expect(heading.tagName).toBe("H3");
    });

    it("should have proper button in error state", () => {
      Object.assign(mockHookReturn, {
        isLoading: false,
        error: "Test error",
        progress: 0,
        session: null,
      });

      render(<SessionLoader {...defaultProps} />);

      const button = screen.getByText("Reload App");
      expect(button.tagName).toBe("BUTTON");
    });
  });
});
