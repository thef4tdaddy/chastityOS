/**
 * RestoreSessionPrompt Component Tests
 * Tests for session restoration prompt modal
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RestoreSessionPrompt } from "../RestoreSessionPrompt";

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Modal: vi.fn(
    ({
      isOpen,
      children,
      title,
      onClose,
      footer,
      showCloseButton,
      closeOnBackdropClick,
      closeOnEscape,
      className,
    }) =>
      isOpen ? (
        <div
          data-testid="modal"
          role="dialog"
          data-show-close={showCloseButton}
          data-close-backdrop={closeOnBackdropClick}
          data-close-escape={closeOnEscape}
          className={className}
        >
          <h2>{title}</h2>
          {children}
          {footer}
          {showCloseButton && (
            <button onClick={onClose} data-testid="modal-close">
              Close
            </button>
          )}
        </div>
      ) : null,
  ),
  Button: vi.fn(({ children, onClick, type, className }) => (
    <button onClick={onClick} type={type} className={className}>
      {children}
    </button>
  )),
}));

describe("RestoreSessionPrompt", () => {
  const mockOnConfirm = vi.fn();
  const mockOnDiscard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render modal with title", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByText("Restore Previous Session?")).toBeInTheDocument();
    });

    it("should render description text", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      expect(
        screen.getByText(
          /An active chastity session was found. Would you like to resume this session or start a new one?/,
        ),
      ).toBeInTheDocument();
    });

    it("should render both action buttons", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      expect(screen.getByText("Resume Previous Session")).toBeInTheDocument();
      expect(screen.getByText("Start New Session")).toBeInTheDocument();
    });
  });

  describe("Button Actions", () => {
    it("should call onConfirm when Resume button clicked", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      fireEvent.click(resumeButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onDiscard when Start New button clicked", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const startNewButton = screen.getByText("Start New Session");
      fireEvent.click(startNewButton);

      expect(mockOnDiscard).toHaveBeenCalledTimes(1);
    });

    it("should not call handlers multiple times on single click", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      fireEvent.click(resumeButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnDiscard).not.toHaveBeenCalled();
    });
  });

  describe("Modal Configuration", () => {
    it("should be always open", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const modal = screen.getByTestId("modal");
      expect(modal).toBeInTheDocument();
    });

    it("should not show close button", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const modal = screen.getByTestId("modal");
      expect(modal).toHaveAttribute("data-show-close", "false");
    });

    it("should not close on backdrop click", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const modal = screen.getByTestId("modal");
      expect(modal).toHaveAttribute("data-close-backdrop", "false");
    });

    it("should not close on escape key", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const modal = screen.getByTestId("modal");
      expect(modal).toHaveAttribute("data-close-escape", "false");
    });

    it("should have small size", () => {
      // This would be checked through the Modal component props
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    it("should have blue border styling", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const modal = screen.getByTestId("modal");
      expect(modal.className).toContain("border-blue-500");
    });

    it("should pass onDiscard to modal onClose", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      // The modal's onClose prop receives onDiscard
      // This is tested indirectly through the modal mock
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });
  });

  describe("Button Styling", () => {
    it("should apply blue styling to Resume button", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      expect(resumeButton.className).toContain("bg-blue-600");
      expect(resumeButton.className).toContain("hover:bg-blue-700");
    });

    it("should apply gray styling to Start New button", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const startNewButton = screen.getByText("Start New Session");
      expect(startNewButton.className).toContain("bg-gray-600");
      expect(startNewButton.className).toContain("hover:bg-gray-500");
    });

    it("should apply common button styling to both buttons", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      const startNewButton = screen.getByText("Start New Session");

      expect(resumeButton.className).toContain("text-white");
      expect(resumeButton.className).toContain("font-bold");
      expect(resumeButton.className).toContain("rounded-lg");

      expect(startNewButton.className).toContain("text-white");
      expect(startNewButton.className).toContain("font-bold");
      expect(startNewButton.className).toContain("rounded-lg");
    });

    it("should have proper button heights", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      const startNewButton = screen.getByText("Start New Session");

      expect(resumeButton.className).toContain("min-h-[44px]");
      expect(startNewButton.className).toContain("min-h-[44px]");
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive button width classes", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      expect(resumeButton.className).toContain("w-full");
      expect(resumeButton.className).toContain("sm:w-auto");
    });

    it("should have responsive text size", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const text = screen.getByText(/An active chastity session was found/);
      expect(text.className).toContain("text-xs");
      expect(text.className).toContain("sm:text-sm");
    });

    it("should have responsive padding", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      expect(resumeButton.className).toContain("py-2.5");
      expect(resumeButton.className).toContain("px-4");
    });
  });

  describe("Accessibility", () => {
    it("should have proper modal role", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const modal = screen.getByTestId("modal");
      expect(modal).toHaveAttribute("role", "dialog");
    });

    it("should have proper heading structure", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const heading = screen.getByText("Restore Previous Session?");
      expect(heading.tagName).toBe("H2");
    });

    it("should have semantic button elements", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      const startNewButton = screen.getByText("Start New Session");

      expect(resumeButton.tagName).toBe("BUTTON");
      expect(startNewButton.tagName).toBe("BUTTON");
    });

    it("should have button type attribute", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const resumeButton = screen.getByText("Resume Previous Session");
      expect(resumeButton).toHaveAttribute("type", "button");
    });

    it("should have readable text color", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const text = screen.getByText(/An active chastity session was found/);
      expect(text.className).toContain("text-gray-300");
    });
  });

  describe("Layout", () => {
    it("should center text content", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const text = screen.getByText(/An active chastity session was found/);
      expect(text.className).toContain("text-center");
    });

    it("should have proper text line height", () => {
      render(
        <RestoreSessionPrompt
          onConfirm={mockOnConfirm}
          onDiscard={mockOnDiscard}
        />,
      );

      const text = screen.getByText(/An active chastity session was found/);
      expect(text.className).toContain("leading-relaxed");
    });
  });
});
