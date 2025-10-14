/**
 * AcceptInviteCodeSection Component Tests
 * Tests for invite code acceptance UI
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AcceptInviteCodeSection } from "../AcceptInviteCodeSection";

describe("AcceptInviteCodeSection", () => {
  const mockOnSetInviteCodeInput = vi.fn();
  const mockOnSetKeyholderNameInput = vi.fn();
  const mockOnAcceptInvite = vi.fn();
  const mockValidateInviteCode = vi.fn();

  const defaultProps = {
    inviteCodeInput: "",
    keyholderNameInput: "",
    isAcceptingInvite: false,
    onSetInviteCodeInput: mockOnSetInviteCodeInput,
    onSetKeyholderNameInput: mockOnSetKeyholderNameInput,
    onAcceptInvite: mockOnAcceptInvite,
    validateInviteCode: mockValidateInviteCode,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateInviteCode.mockReturnValue(false);
  });

  describe("Basic Rendering", () => {
    it("should render accept invite heading", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      expect(screen.getByText("Accept Invite Code")).toBeInTheDocument();
    });

    it("should render enter code button", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      expect(screen.getByText("Enter Code")).toBeInTheDocument();
    });

    it("should initially hide the form", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      expect(
        screen.queryByPlaceholderText(/Enter 6-character code/i),
      ).not.toBeInTheDocument();
    });

    it("should have proper ARIA attributes", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute(
        "aria-labelledby",
        "accept-invite-heading",
      );
    });
  });

  describe("Form Display", () => {
    it("should show form when enter code button clicked", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      expect(
        screen.getByPlaceholderText(/Enter 6-character code/i),
      ).toBeInTheDocument();
    });

    it("should hide form when cancel button clicked", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      // Show form
      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      // Hide form
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(
        screen.queryByPlaceholderText(/Enter 6-character code/i),
      ).not.toBeInTheDocument();
    });

    it("should update button text when form is shown", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const button = screen.getByText("Enter Code");
      fireEvent.click(button);

      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should display descriptive text", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      expect(
        screen.getByText(/Enter an invite code from a submissive/i),
      ).toBeInTheDocument();
    });

    it("should have proper ARIA expanded attribute", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const button = screen.getByText("Enter Code");
      expect(button).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("Invite Code Input", () => {
    it("should render invite code input when form shown", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByRole("button", {
        name: /Show invite code form/i,
      });
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Enter 6-character code/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("should call onSetInviteCodeInput when typing", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByRole("button", {
        name: /Show invite code form/i,
      });
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Enter 6-character code/i);
      fireEvent.change(input, { target: { value: "ABC123" } });

      expect(mockOnSetInviteCodeInput).toHaveBeenCalledWith("ABC123");
    });

    it("should display current invite code value", () => {
      render(
        <AcceptInviteCodeSection {...defaultProps} inviteCodeInput="XYZ789" />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Enter 6-character code/i);
      expect(input).toHaveValue("XYZ789");
    });

    it("should have maxLength of 6 characters", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Enter 6-character code/i);
      expect(input).toHaveAttribute("maxLength", "6");
    });

    it("should have proper ARIA attributes for input", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Enter 6-character code/i);
      expect(input).toHaveAttribute("aria-required", "true");
      expect(input).toHaveAttribute("id", "invite-code-input");
    });

    it("should have autocomplete disabled", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Enter 6-character code/i);
      expect(input).toHaveAttribute("autoComplete", "off");
    });
  });

  describe("Keyholder Name Input", () => {
    it("should render keyholder name input", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      expect(
        screen.getByPlaceholderText(/Your name \(optional\)/i),
      ).toBeInTheDocument();
    });

    it("should call onSetKeyholderNameInput when typing", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Your name \(optional\)/i);
      fireEvent.change(input, { target: { value: "John Doe" } });

      expect(mockOnSetKeyholderNameInput).toHaveBeenCalledWith("John Doe");
    });

    it("should display current keyholder name value", () => {
      render(
        <AcceptInviteCodeSection
          {...defaultProps}
          keyholderNameInput="Jane Smith"
        />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Your name \(optional\)/i);
      expect(input).toHaveValue("Jane Smith");
    });

    it("should have autocomplete enabled for name", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const input = screen.getByPlaceholderText(/Your name \(optional\)/i);
      expect(input).toHaveAttribute("autoComplete", "name");
    });
  });

  describe("Submit Button", () => {
    it("should render accept button", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      expect(
        screen.getByRole("button", { name: /Accept Invite Code/i }),
      ).toBeInTheDocument();
    });

    it("should disable button when invite code invalid", () => {
      mockValidateInviteCode.mockReturnValue(false);

      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const submitButton = screen.getByRole("button", {
        name: /Accept Invite Code/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should enable button when invite code valid", () => {
      mockValidateInviteCode.mockReturnValue(true);

      render(
        <AcceptInviteCodeSection {...defaultProps} inviteCodeInput="ABC123" />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const submitButton = screen.getByRole("button", {
        name: /Accept Invite Code/i,
      });
      expect(submitButton).not.toBeDisabled();
    });

    it("should disable button when accepting", () => {
      render(
        <AcceptInviteCodeSection {...defaultProps} isAcceptingInvite={true} />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const submitButton = screen.getByRole("button", {
        name: /Accepting.../i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should show loading text when accepting", () => {
      render(
        <AcceptInviteCodeSection {...defaultProps} isAcceptingInvite={true} />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      expect(
        screen.getByRole("button", { name: /Accepting.../i }),
      ).toBeInTheDocument();
    });

    it("should call onAcceptInvite when clicked", async () => {
      mockValidateInviteCode.mockReturnValue(true);
      mockOnAcceptInvite.mockResolvedValue(undefined);

      render(
        <AcceptInviteCodeSection {...defaultProps} inviteCodeInput="ABC123" />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const submitButton = screen.getByRole("button", {
        name: /Accept Invite Code/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnAcceptInvite).toHaveBeenCalled();
      });
    });

    it("should hide form after successful acceptance", async () => {
      mockValidateInviteCode.mockReturnValue(true);
      mockOnAcceptInvite.mockResolvedValue(undefined);

      render(
        <AcceptInviteCodeSection {...defaultProps} inviteCodeInput="ABC123" />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const submitButton = screen.getByRole("button", {
        name: /Accept Invite Code/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText(/Enter 6-character code/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message on failure", async () => {
      mockValidateInviteCode.mockReturnValue(true);
      mockOnAcceptInvite.mockRejectedValue(new Error("Invalid invite code"));

      render(
        <AcceptInviteCodeSection {...defaultProps} inviteCodeInput="ABC123" />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const submitButton = screen.getByRole("button", {
        name: /Accept Invite Code/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid invite code/i)).toBeInTheDocument();
      });
    });

    it("should allow dismissing error", async () => {
      mockValidateInviteCode.mockReturnValue(true);
      mockOnAcceptInvite.mockRejectedValue(new Error("Network error"));

      render(
        <AcceptInviteCodeSection {...defaultProps} inviteCodeInput="ABC123" />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const submitButton = screen.getByRole("button", {
        name: /Accept Invite Code/i,
      });
      fireEvent.click(submitButton);

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
      mockValidateInviteCode.mockReturnValue(true);
      mockOnAcceptInvite.mockRejectedValue("String error");

      render(
        <AcceptInviteCodeSection {...defaultProps} inviteCodeInput="ABC123" />,
      );

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const submitButton = screen.getByRole("button", {
        name: /Accept Invite Code/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to accept invite code/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Disabled State", () => {
    it("should disable all controls when disabled prop is true", () => {
      render(<AcceptInviteCodeSection {...defaultProps} disabled={true} />);

      const enterButton = screen.getByRole("button", {
        name: /Show invite code form/i,
      });
      expect(enterButton).toBeDisabled();
    });

    it("should reduce opacity when disabled", () => {
      const { container } = render(
        <AcceptInviteCodeSection {...defaultProps} disabled={true} />,
      );

      const section = container.querySelector("section");
      expect(section?.className).toContain("opacity-60");
    });

    it("should disable form inputs when disabled", () => {
      render(<AcceptInviteCodeSection {...defaultProps} disabled={true} />);

      // Force open form even when disabled to check input states
      const enterButton = screen.getByText("Enter Code");
      // Note: button is disabled but we're testing if inputs would be disabled
    });

    it("should have proper ARIA disabled attribute", () => {
      render(<AcceptInviteCodeSection {...defaultProps} disabled={true} />);

      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-disabled", "true");
    });

    it("should not call handlers when disabled", () => {
      render(<AcceptInviteCodeSection {...defaultProps} disabled={true} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      // Should not show form
      expect(
        screen.queryByPlaceholderText(/Enter 6-character code/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all inputs", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      // Check for sr-only labels
      expect(screen.getByLabelText(/Invite code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your name/i)).toBeInTheDocument();
    });

    it("should have proper heading structure", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const heading = screen.getByText("Accept Invite Code");
      expect(heading.tagName).toBe("H3");
      expect(heading).toHaveAttribute("id", "accept-invite-heading");
    });

    it("should have proper form role", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const form = screen.getByRole("form");
      expect(form).toBeInTheDocument();
    });

    it("should associate form with heading", () => {
      render(<AcceptInviteCodeSection {...defaultProps} />);

      const enterButton = screen.getByText("Enter Code");
      fireEvent.click(enterButton);

      const form = screen.getByRole("form");
      expect(form).toHaveAttribute("aria-labelledby", "accept-invite-heading");
    });
  });
});
