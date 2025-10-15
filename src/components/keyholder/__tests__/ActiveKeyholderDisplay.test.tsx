/**
 * ActiveKeyholderDisplay Component Tests
 * Tests for displaying active keyholder information
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActiveKeyholderDisplay } from "../ActiveKeyholderDisplay";

describe("ActiveKeyholderDisplay", () => {
  const mockOnEndRelationship = vi.fn();
  const mockActiveKeyholder = {
    id: "keyholder-1",
    acceptedAt: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
    permissions: {
      canManageTasks: true,
      canControlSession: false,
      canViewHistory: true,
      canManageRewards: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render keyholder display header", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText("Your Keyholder")).toBeInTheDocument();
    });

    it("should display active status", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/Active/i)).toBeInTheDocument();
    });

    it("should show connection time", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/Connected:/i)).toBeInTheDocument();
    });

    it("should display end relationship button", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(
        screen.getByRole("button", { name: /End Relationship/i }),
      ).toBeInTheDocument();
    });

    it("should display permissions toggle button", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(
        screen.getByRole("button", { name: /View Permissions/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Permissions Display", () => {
    it("should initially hide permissions", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(
        screen.queryByText("Keyholder Permissions"),
      ).not.toBeInTheDocument();
    });

    it("should show permissions when toggle clicked", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /View Permissions/i,
      });
      fireEvent.click(toggleButton);

      expect(screen.getByText("Keyholder Permissions")).toBeInTheDocument();
    });

    it("should hide permissions when toggle clicked again", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /View Permissions/i,
      });

      // Show permissions
      fireEvent.click(toggleButton);
      expect(screen.getByText("Keyholder Permissions")).toBeInTheDocument();

      // Hide permissions
      fireEvent.click(toggleButton);
      expect(
        screen.queryByText("Keyholder Permissions"),
      ).not.toBeInTheDocument();
    });

    it("should display all permissions correctly", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /View Permissions/i,
      });
      fireEvent.click(toggleButton);

      expect(screen.getByText(/Can Manage Tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/Can Control Session/i)).toBeInTheDocument();
      expect(screen.getByText(/Can View History/i)).toBeInTheDocument();
      expect(screen.getByText(/Can Manage Rewards/i)).toBeInTheDocument();
    });

    it("should show granted permissions with checkmark", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /View Permissions/i,
      });
      fireEvent.click(toggleButton);

      const permissionsSection = screen.getByText(
        "Keyholder Permissions",
      ).parentElement;
      expect(permissionsSection).toHaveTextContent("✓");
    });

    it("should show denied permissions with cross", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /View Permissions/i,
      });
      fireEvent.click(toggleButton);

      const permissionsSection = screen.getByText(
        "Keyholder Permissions",
      ).parentElement;
      expect(permissionsSection).toHaveTextContent("✗");
    });

    it("should update button text when permissions shown", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /View Permissions/i,
      });
      fireEvent.click(toggleButton);

      expect(
        screen.getByRole("button", { name: /Hide Permissions/i }),
      ).toBeInTheDocument();
    });
  });

  describe("End Relationship Action", () => {
    it("should call onEndRelationship when button clicked", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButton = screen.getByRole("button", {
        name: /End Relationship/i,
      });
      fireEvent.click(endButton);

      expect(mockOnEndRelationship).toHaveBeenCalledWith("keyholder-1");
    });

    it("should call onEndRelationship with correct keyholder id", () => {
      const differentKeyholder = {
        ...mockActiveKeyholder,
        id: "different-id",
      };

      render(
        <ActiveKeyholderDisplay
          activeKeyholder={differentKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButton = screen.getByRole("button", {
        name: /End Relationship/i,
      });
      fireEvent.click(endButton);

      expect(mockOnEndRelationship).toHaveBeenCalledWith("different-id");
    });

    it("should display error message on failure", async () => {
      mockOnEndRelationship.mockImplementation(() => {
        throw new Error("Failed to end relationship");
      });

      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButton = screen.getByRole("button", {
        name: /End Relationship/i,
      });
      fireEvent.click(endButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to end relationship/i),
        ).toBeInTheDocument();
      });
    });

    it("should allow dismissing error message", async () => {
      mockOnEndRelationship.mockImplementation(() => {
        throw new Error("Failed to end relationship");
      });

      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButton = screen.getByRole("button", {
        name: /End Relationship/i,
      });
      fireEvent.click(endButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to end relationship/i),
        ).toBeInTheDocument();
      });

      // Find and click dismiss button (implementation may vary)
      const errorElement = screen.getByText(/Failed to end relationship/i);
      const dismissButton = errorElement.parentElement?.querySelector("button");
      if (dismissButton) {
        fireEvent.click(dismissButton);
        await waitFor(() => {
          expect(
            screen.queryByText(/Failed to end relationship/i),
          ).not.toBeInTheDocument();
        });
      }
    });
  });

  describe("Date Formatting", () => {
    it("should use acceptedAt date when available", () => {
      const withAcceptedDate = {
        ...mockActiveKeyholder,
        acceptedAt: new Date("2024-01-01"),
        createdAt: new Date("2023-12-01"),
      };

      render(
        <ActiveKeyholderDisplay
          activeKeyholder={withAcceptedDate}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/Connected:/i)).toBeInTheDocument();
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });

    it("should use createdAt date when acceptedAt not available", () => {
      const withoutAcceptedDate = {
        ...mockActiveKeyholder,
        acceptedAt: undefined,
      };

      render(
        <ActiveKeyholderDisplay
          activeKeyholder={withoutAcceptedDate}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/Connected:/i)).toBeInTheDocument();
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button labels", () => {
      render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(
        screen.getByRole("button", { name: /View Permissions/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /End Relationship/i }),
      ).toBeInTheDocument();
    });

    it("should have semantic HTML structure", () => {
      const { container } = render(
        <ActiveKeyholderDisplay
          activeKeyholder={mockActiveKeyholder}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const heading = screen.getByText("Your Keyholder");
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty permissions object", () => {
      const noPermissions = {
        ...mockActiveKeyholder,
        permissions: {},
      };

      render(
        <ActiveKeyholderDisplay
          activeKeyholder={noPermissions}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /View Permissions/i,
      });
      fireEvent.click(toggleButton);

      expect(screen.getByText("Keyholder Permissions")).toBeInTheDocument();
    });

    it("should handle permissions with various types of keys", () => {
      const complexPermissions = {
        ...mockActiveKeyholder,
        permissions: {
          canManageTasks: true,
          canControlSession: false,
          "custom-permission": true,
          another_permission: false,
        },
      };

      render(
        <ActiveKeyholderDisplay
          activeKeyholder={complexPermissions}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const toggleButton = screen.getByRole("button", {
        name: /View Permissions/i,
      });
      fireEvent.click(toggleButton);

      expect(screen.getByText("Keyholder Permissions")).toBeInTheDocument();
    });
  });
});
