/**
 * SubmissiveRelationshipsDisplay Component Tests
 * Tests for displaying submissive relationships
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SubmissiveRelationshipsDisplay } from "../SubmissiveRelationshipsDisplay";

describe("SubmissiveRelationshipsDisplay", () => {
  const mockOnEndRelationship = vi.fn();
  const mockRelationships = [
    {
      id: "rel-1",
      acceptedAt: new Date("2024-01-01"),
      createdAt: new Date("2024-01-01"),
      permissions: {
        canManageTasks: true,
        canControlSession: false,
        canViewHistory: true,
      },
    },
    {
      id: "rel-2",
      createdAt: new Date("2024-02-01"),
      permissions: {
        canManageTasks: true,
        canControlSession: true,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render heading", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText("Your Submissives")).toBeInTheDocument();
    });

    it("should render all relationships", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const activeLabels = screen.getAllByText("Active Submissive");
      expect(activeLabels).toHaveLength(2);
    });

    it("should not render when no relationships", () => {
      const { container } = render(
        <SubmissiveRelationshipsDisplay
          relationships={[]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should have proper heading structure", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const heading = screen.getByText("Your Submissives");
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("Relationship Display", () => {
    it("should display connection time", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getAllByText(/Connected:/i)).toHaveLength(2);
      expect(screen.getAllByText(/ago/i).length).toBeGreaterThan(0);
    });

    it("should display permissions count", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/2 of 3 granted/i)).toBeInTheDocument();
      expect(screen.getByText(/2 of 2 granted/i)).toBeInTheDocument();
    });

    it("should display end button for each relationship", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButtons = screen.getAllByRole("button", { name: /End/i });
      expect(endButtons).toHaveLength(2);
    });

    it("should display active status", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const activeLabels = screen.getAllByText("Active Submissive");
      expect(activeLabels).toHaveLength(2);
    });
  });

  describe("Date Formatting", () => {
    it("should use acceptedAt when available", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={[mockRelationships[0]]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/Connected:/i)).toBeInTheDocument();
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });

    it("should use createdAt when acceptedAt not available", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={[mockRelationships[1]]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/Connected:/i)).toBeInTheDocument();
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });
  });

  describe("End Relationship Action", () => {
    it("should call onEndRelationship when button clicked", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={[mockRelationships[0]]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButton = screen.getByRole("button", { name: /End/i });
      fireEvent.click(endButton);

      expect(mockOnEndRelationship).toHaveBeenCalledWith("rel-1");
    });

    it("should call with correct relationship id", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButtons = screen.getAllByRole("button", { name: /End/i });

      fireEvent.click(endButtons[0]);
      expect(mockOnEndRelationship).toHaveBeenCalledWith("rel-1");

      fireEvent.click(endButtons[1]);
      expect(mockOnEndRelationship).toHaveBeenCalledWith("rel-2");
    });

    it("should display error on failure", async () => {
      mockOnEndRelationship.mockImplementation(() => {
        throw new Error("Failed to end relationship");
      });

      render(
        <SubmissiveRelationshipsDisplay
          relationships={[mockRelationships[0]]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButton = screen.getByRole("button", { name: /End/i });
      fireEvent.click(endButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to end relationship/i),
        ).toBeInTheDocument();
      });
    });

    it("should allow dismissing error", async () => {
      mockOnEndRelationship.mockImplementation(() => {
        throw new Error("Test error");
      });

      render(
        <SubmissiveRelationshipsDisplay
          relationships={[mockRelationships[0]]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButton = screen.getByRole("button", { name: /End/i });
      fireEvent.click(endButton);

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });

      const errorElement = screen.getByText(/Test error/i);
      const dismissButton = errorElement.parentElement?.querySelector("button");
      if (dismissButton) {
        fireEvent.click(dismissButton);
        await waitFor(() => {
          expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe("Permissions Display", () => {
    it("should calculate correct permission count", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={[mockRelationships[0]]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/2 of 3 granted/i)).toBeInTheDocument();
    });

    it("should handle all permissions granted", () => {
      const allGranted = {
        id: "rel-all",
        createdAt: new Date(),
        permissions: {
          canManageTasks: true,
          canControlSession: true,
          canViewHistory: true,
        },
      };

      render(
        <SubmissiveRelationshipsDisplay
          relationships={[allGranted]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/3 of 3 granted/i)).toBeInTheDocument();
    });

    it("should handle no permissions granted", () => {
      const noneGranted = {
        id: "rel-none",
        createdAt: new Date(),
        permissions: {
          canManageTasks: false,
          canControlSession: false,
        },
      };

      render(
        <SubmissiveRelationshipsDisplay
          relationships={[noneGranted]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/0 of 2 granted/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const heading = screen.getByText("Your Submissives");
      expect(heading.tagName).toBe("H3");
    });

    it("should have accessible buttons", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const endButtons = screen.getAllByRole("button", { name: /End/i });
      expect(endButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Animation and Styling", () => {
    it("should apply staggered animation delay", () => {
      const { container } = render(
        <SubmissiveRelationshipsDisplay
          relationships={mockRelationships}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const cards = container.querySelectorAll(".relationship-card-enter");
      expect(cards.length).toBe(2);

      // Check that animation delays are different
      const delay1 = (cards[0] as HTMLElement).style.animationDelay;
      const delay2 = (cards[1] as HTMLElement).style.animationDelay;
      expect(delay1).not.toBe(delay2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single relationship", () => {
      render(
        <SubmissiveRelationshipsDisplay
          relationships={[mockRelationships[0]]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText("Active Submissive")).toBeInTheDocument();
    });

    it("should handle empty permissions", () => {
      const emptyPermissions = {
        id: "rel-empty",
        createdAt: new Date(),
        permissions: {},
      };

      render(
        <SubmissiveRelationshipsDisplay
          relationships={[emptyPermissions]}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      expect(screen.getByText(/0 of 0 granted/i)).toBeInTheDocument();
    });

    it("should handle many relationships", () => {
      const manyRels = Array.from({ length: 5 }, (_, i) => ({
        id: `rel-${i}`,
        createdAt: new Date(),
        permissions: { canManageTasks: true },
      }));

      render(
        <SubmissiveRelationshipsDisplay
          relationships={manyRels}
          onEndRelationship={mockOnEndRelationship}
        />,
      );

      const activeLabels = screen.getAllByText("Active Submissive");
      expect(activeLabels).toHaveLength(5);
    });
  });
});
