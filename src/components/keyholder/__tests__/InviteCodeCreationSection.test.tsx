/**
 * InviteCodeCreationSection Component Tests
 * Tests for invite code creation UI
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InviteCodeCreationSection } from "../InviteCodeCreationSection";

describe("InviteCodeCreationSection", () => {
  const mockOnCreateInvite = vi.fn();

  const defaultProps = {
    shouldShow: true,
    isCreatingInvite: false,
    onCreateInvite: mockOnCreateInvite,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render when shouldShow is true", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      expect(screen.getByText("Create Invite Code")).toBeInTheDocument();
    });

    it("should not render when shouldShow is false", () => {
      render(
        <InviteCodeCreationSection {...defaultProps} shouldShow={false} />,
      );

      expect(screen.queryByText("Create Invite Code")).not.toBeInTheDocument();
    });

    it("should render create code button", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      expect(screen.getByText("Create Code")).toBeInTheDocument();
    });

    it("should have proper ARIA attributes", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-labelledby", "invite-code-heading");
    });

    it("should have proper heading structure", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const heading = screen.getByText("Create Invite Code");
      expect(heading.tagName).toBe("H3");
      expect(heading).toHaveAttribute("id", "invite-code-heading");
    });
  });

  describe("Form Display", () => {
    it("should initially hide the form", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      expect(
        screen.queryByText(/Generate an invite code/i),
      ).not.toBeInTheDocument();
    });

    it("should show form when create code button clicked", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      expect(screen.getByText(/Generate an invite code/i)).toBeInTheDocument();
    });

    it("should hide form when cancel button clicked", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      // Show form
      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      // Hide form
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(
        screen.queryByText(/Generate an invite code/i),
      ).not.toBeInTheDocument();
    });

    it("should update button text when form is shown", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const button = screen.getByText("Create Code");
      fireEvent.click(button);

      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should have proper ARIA expanded attribute", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const button = screen.getByText("Create Code");
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should display descriptive text", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      expect(
        screen.getByText(/Generate an invite code for a keyholder/i),
      ).toBeInTheDocument();
    });
  });

  describe("Generate Button", () => {
    it("should render generate button when form shown", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      expect(
        screen.getByRole("button", { name: /Generate Invite Code/i }),
      ).toBeInTheDocument();
    });

    it("should call onCreateInvite when clicked", async () => {
      mockOnCreateInvite.mockResolvedValue(undefined);

      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Generate Invite Code/i,
      });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockOnCreateInvite).toHaveBeenCalled();
      });
    });

    it("should disable button when creating", () => {
      render(
        <InviteCodeCreationSection {...defaultProps} isCreatingInvite={true} />,
      );

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Creating.../i,
      });
      expect(generateButton).toBeDisabled();
    });

    it("should show loading text when creating", () => {
      render(
        <InviteCodeCreationSection {...defaultProps} isCreatingInvite={true} />,
      );

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      expect(
        screen.getByRole("button", { name: /Creating.../i }),
      ).toBeInTheDocument();
    });

    it("should hide form after successful creation", async () => {
      mockOnCreateInvite.mockResolvedValue(undefined);

      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Generate Invite Code/i,
      });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/Generate an invite code/i),
        ).not.toBeInTheDocument();
      });
    });

    it("should have proper ARIA label", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Generate Invite Code/i,
      });
      expect(generateButton).toHaveAttribute(
        "aria-label",
        "Generate invite code",
      );
    });

    it("should update ARIA label when creating", () => {
      render(
        <InviteCodeCreationSection {...defaultProps} isCreatingInvite={true} />,
      );

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Creating.../i,
      });
      expect(generateButton).toHaveAttribute(
        "aria-label",
        "Creating invite code",
      );
    });
  });

  describe("Error Handling", () => {
    it("should display error message on failure", async () => {
      mockOnCreateInvite.mockRejectedValue(new Error("Failed to create code"));

      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Generate Invite Code/i,
      });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create code/i)).toBeInTheDocument();
      });
    });

    it("should allow dismissing error", async () => {
      mockOnCreateInvite.mockRejectedValue(new Error("Network error"));

      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Generate Invite Code/i,
      });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      // Find and click dismiss button in error message
      const errorElement = screen.getByText(/Network error/i);
      const dismissButton = errorElement.parentElement?.querySelector("button");
      if (dismissButton) {
        fireEvent.click(dismissButton);
        await waitFor(() => {
          expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
        });
      }
    });

    it("should handle generic error", async () => {
      mockOnCreateInvite.mockRejectedValue("String error");

      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Generate Invite Code/i,
      });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to create invite code/i),
        ).toBeInTheDocument();
      });
    });

    it("should clear error when form is cancelled", async () => {
      mockOnCreateInvite.mockRejectedValue(new Error("Test error"));

      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      const generateButton = screen.getByRole("button", {
        name: /Generate Invite Code/i,
      });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });

      // Cancel the form
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      // Error should be cleared
      expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();
    });

    it("should clear error when reopening form", async () => {
      mockOnCreateInvite.mockRejectedValue(new Error("Test error"));

      render(<InviteCodeCreationSection {...defaultProps} />);

      // Open form
      let createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      // Try to create and fail
      const generateButton = screen.getByRole("button", {
        name: /Generate Invite Code/i,
      });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Test error/i)).toBeInTheDocument();
      });

      // Close form
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      // Reopen form
      createButton = screen.getByText("Create Code");
      fireEvent.click(createButton);

      // Error should not be shown
      expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button labels", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      expect(createButton).toHaveAttribute(
        "aria-label",
        "Show invite code creation form",
      );

      fireEvent.click(createButton);

      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toHaveAttribute(
        "aria-label",
        "Cancel invite code creation",
      );
    });

    it("should have proper ARIA controls attribute", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      expect(createButton).toHaveAttribute("aria-controls", "invite-code-form");
    });

    it("should associate form with heading", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-labelledby", "invite-code-heading");
    });

    it("should have semantic HTML structure", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const heading = screen.getByText("Create Invite Code");
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid clicks on create button", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });

      // Click multiple times rapidly
      fireEvent.click(createButton);
      fireEvent.click(createButton);
      fireEvent.click(createButton);

      // Form should still be shown (last click closes it)
      expect(
        screen.queryByText(/Generate an invite code/i),
      ).not.toBeInTheDocument();
    });

    it("should maintain state through show/hide cycles", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });

      // Show
      fireEvent.click(createButton);
      expect(screen.getByText(/Generate an invite code/i)).toBeInTheDocument();

      // Hide
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      expect(
        screen.queryByText(/Generate an invite code/i),
      ).not.toBeInTheDocument();

      // Show again
      fireEvent.click(createButton);
      expect(screen.getByText(/Generate an invite code/i)).toBeInTheDocument();
    });

    it("should not call onCreateInvite when form is hidden", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      // Don't show form, just try to find generate button
      expect(
        screen.queryByRole("button", { name: /Generate Invite Code/i }),
      ).not.toBeInTheDocument();

      // onCreateInvite should not have been called
      expect(mockOnCreateInvite).not.toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    it("should show normal button text when not creating", () => {
      render(<InviteCodeCreationSection {...defaultProps} />);

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      expect(
        screen.getByRole("button", { name: /Generate Invite Code/i }),
      ).toBeInTheDocument();
    });

    it("should prevent form closure during creation", () => {
      render(
        <InviteCodeCreationSection {...defaultProps} isCreatingInvite={true} />,
      );

      const createButton = screen.getByRole("button", {
        name: /Create Code/i,
      });
      fireEvent.click(createButton);

      // Generate button should be disabled
      const generateButton = screen.getByRole("button", {
        name: /Creating.../i,
      });
      expect(generateButton).toBeDisabled();
    });

    it("should maintain form visibility during creation", () => {
      render(
        <InviteCodeCreationSection {...defaultProps} isCreatingInvite={true} />,
      );

      const createButton = screen.getByText("Create Code");
      fireEvent.click(createButton);

      // Form should remain visible
      expect(screen.getByText(/Generate an invite code/i)).toBeInTheDocument();
      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });
  });
});
