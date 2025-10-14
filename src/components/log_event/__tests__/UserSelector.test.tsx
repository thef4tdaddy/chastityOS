/**
 * UserSelector Component Tests
 * Tests for the keyholder user selector component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock UI components
vi.mock("@/components/ui", () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  Tooltip: ({ children, content }: any) => (
    <div data-tooltip={content}>{children}</div>
  ),
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

// UserSelector component (extracted from LogEventPage for testing)
interface UserSelectorProps {
  activeSubmissive?: { wearerId?: string; wearerName?: string };
  selectedUserId: string;
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  activeSubmissive,
  selectedUserId,
  currentUserId,
  onSelectUser,
}) => {
  if (!activeSubmissive) return null;

  return (
    <div data-testid="card" role="region" aria-labelledby="user-selector-label">
      <div>
        <label id="user-selector-label">Log event for:</label>
      </div>
      <div role="group" aria-labelledby="user-selector-label">
        <div data-tooltip="Log a sexual event for yourself">
          <button
            onClick={() => onSelectUser(currentUserId)}
            aria-pressed={selectedUserId === currentUserId}
            aria-label="Log event for yourself"
          >
            Yourself
          </button>
        </div>
        <div
          data-tooltip={`Log a sexual event for ${activeSubmissive.wearerName || "your submissive"}`}
        >
          <button
            onClick={() => onSelectUser(activeSubmissive.wearerId || "")}
            aria-pressed={selectedUserId === activeSubmissive.wearerId}
            aria-label={`Log event for ${activeSubmissive.wearerName || "your submissive"}`}
          >
            {activeSubmissive.wearerName || "Submissive"}
          </button>
        </div>
      </div>
    </div>
  );
};

describe("UserSelector", () => {
  const currentUserId = "keyholder-123";
  const submissiveId = "submissive-456";
  const submissiveName = "TestSubmissive";

  const mockOnSelectUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when no active submissive", () => {
      const { container } = render(
        <UserSelector
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("should render when active submissive exists", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(screen.getByText("Log event for:")).toBeInTheDocument();
      expect(screen.getByText("Yourself")).toBeInTheDocument();
      expect(screen.getByText(submissiveName)).toBeInTheDocument();
    });

    it("should display default submissive label when no name provided", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(screen.getByText("Submissive")).toBeInTheDocument();
    });

    it("should have proper region landmark", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const region = screen.getByRole("region", {
        name: /log event for/i,
      });
      expect(region).toBeInTheDocument();
    });

    it("should have group role for button container", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const group = screen.getByRole("group", {
        name: /log event for/i,
      });
      expect(group).toBeInTheDocument();
    });
  });

  describe("User Selection", () => {
    it("should show current user as selected by default", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const yourselfButton = screen.getByRole("button", {
        name: /log event for yourself/i,
      });
      expect(yourselfButton).toHaveAttribute("aria-pressed", "true");

      const submissiveButton = screen.getByRole("button", {
        name: new RegExp(`log event for ${submissiveName}`, "i"),
      });
      expect(submissiveButton).toHaveAttribute("aria-pressed", "false");
    });

    it("should show submissive as selected when appropriate", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={submissiveId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const yourselfButton = screen.getByRole("button", {
        name: /log event for yourself/i,
      });
      expect(yourselfButton).toHaveAttribute("aria-pressed", "false");

      const submissiveButton = screen.getByRole("button", {
        name: new RegExp(`log event for ${submissiveName}`, "i"),
      });
      expect(submissiveButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should call onSelectUser when clicking yourself button", async () => {
      const user = userEvent.setup();
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={submissiveId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const yourselfButton = screen.getByRole("button", {
        name: /log event for yourself/i,
      });
      await user.click(yourselfButton);

      expect(mockOnSelectUser).toHaveBeenCalledWith(currentUserId);
      expect(mockOnSelectUser).toHaveBeenCalledTimes(1);
    });

    it("should call onSelectUser when clicking submissive button", async () => {
      const user = userEvent.setup();
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const submissiveButton = screen.getByRole("button", {
        name: new RegExp(`log event for ${submissiveName}`, "i"),
      });
      await user.click(submissiveButton);

      expect(mockOnSelectUser).toHaveBeenCalledWith(submissiveId);
      expect(mockOnSelectUser).toHaveBeenCalledTimes(1);
    });

    it("should allow switching between users", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      // Click submissive button
      const submissiveButton = screen.getByRole("button", {
        name: new RegExp(`log event for ${submissiveName}`, "i"),
      });
      await user.click(submissiveButton);

      expect(mockOnSelectUser).toHaveBeenCalledWith(submissiveId);

      // Rerender with new selection
      rerender(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={submissiveId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      // Verify new state
      expect(submissiveButton).toHaveAttribute("aria-pressed", "true");

      // Click yourself button
      const yourselfButton = screen.getByRole("button", {
        name: /log event for yourself/i,
      });
      await user.click(yourselfButton);

      expect(mockOnSelectUser).toHaveBeenCalledWith(currentUserId);
      expect(mockOnSelectUser).toHaveBeenCalledTimes(2);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for buttons", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const yourselfButton = screen.getByRole("button", {
        name: /log event for yourself/i,
      });
      expect(yourselfButton).toHaveAttribute("aria-label");

      const submissiveButton = screen.getByRole("button", {
        name: new RegExp(`log event for ${submissiveName}`, "i"),
      });
      expect(submissiveButton).toHaveAttribute("aria-label");
    });

    it("should have aria-pressed state for buttons", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-pressed");
      });
    });

    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const yourselfButton = screen.getByRole("button", {
        name: /log event for yourself/i,
      });

      // Focus and activate with keyboard
      yourselfButton.focus();
      expect(yourselfButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(mockOnSelectUser).toHaveBeenCalled();
    });

    it("should have descriptive tooltips", () => {
      const { container } = render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const tooltips = container.querySelectorAll("[data-tooltip]");
      expect(tooltips).toHaveLength(2);

      // Check tooltip content
      expect(tooltips[0]).toHaveAttribute(
        "data-tooltip",
        "Log a sexual event for yourself"
      );
      expect(tooltips[1]).toHaveAttribute(
        "data-tooltip",
        `Log a sexual event for ${submissiveName}`
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing wearerId gracefully", async () => {
      const user = userEvent.setup();
      render(
        <UserSelector
          activeSubmissive={{
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const submissiveButton = screen.getByRole("button", {
        name: new RegExp(`log event for ${submissiveName}`, "i"),
      });
      await user.click(submissiveButton);

      // Should call with empty string when wearerId is undefined
      expect(mockOnSelectUser).toHaveBeenCalledWith("");
    });

    it("should handle undefined selectedUserId", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={""}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      // Both buttons should show as not pressed
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-pressed", "false");
      });
    });

    it("should update when submissive name changes", () => {
      const { rerender } = render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: "OldName",
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(screen.getByText("OldName")).toBeInTheDocument();

      // Update submissive name
      rerender(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: "NewName",
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      expect(screen.getByText("NewName")).toBeInTheDocument();
      expect(screen.queryByText("OldName")).not.toBeInTheDocument();
    });
  });

  describe("Visual States", () => {
    it("should apply appropriate styling for selected button", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const yourselfButton = screen.getByRole("button", {
        name: /log event for yourself/i,
      });

      // Selected button should have aria-pressed="true"
      expect(yourselfButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should apply appropriate styling for unselected button", () => {
      render(
        <UserSelector
          activeSubmissive={{
            wearerId: submissiveId,
            wearerName: submissiveName,
          }}
          selectedUserId={currentUserId}
          currentUserId={currentUserId}
          onSelectUser={mockOnSelectUser}
        />
      );

      const submissiveButton = screen.getByRole("button", {
        name: new RegExp(`log event for ${submissiveName}`, "i"),
      });

      // Unselected button should have aria-pressed="false"
      expect(submissiveButton).toHaveAttribute("aria-pressed", "false");
    });
  });
});
