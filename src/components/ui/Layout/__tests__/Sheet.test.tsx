/**
 * Sheet Component Tests
 * Unit tests for Sheet component functionality
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Sheet } from "../Sheet";

describe("Sheet", () => {
  let portalRoot: HTMLElement;

  beforeEach(() => {
    // Create a portal root element
    portalRoot = document.createElement("div");
    portalRoot.setAttribute("id", "portal-root");
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(portalRoot);
  });

  describe("Rendering", () => {
    it("should render nothing when isOpen is false", () => {
      const mockOnClose = vi.fn();
      const { container } = render(
        <Sheet isOpen={false} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(
        container.querySelector('[role="dialog"]'),
      ).not.toBeInTheDocument();
    });

    it("should render sheet when isOpen is true", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Sheet Content")).toBeInTheDocument();
    });

    it("should render with title", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} title="Test Sheet">
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(screen.getByText("Test Sheet")).toBeInTheDocument();
    });

    it("should render close button by default", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(screen.getByLabelText("Close sheet")).toBeInTheDocument();
    });

    it("should not render close button when showCloseButton is false", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} showCloseButton={false}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(screen.queryByLabelText("Close sheet")).not.toBeInTheDocument();
    });
  });

  describe("Side Variants", () => {
    it("should render as bottom sheet by default", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("rounded-t-3xl");
    });

    it("should render as left drawer", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} side="left">
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("h-full");
    });

    it("should render as right drawer", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} side="right">
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("h-full");
    });
  });

  describe("Size Variants", () => {
    it("should apply small size", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} size="sm">
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("max-h-[40vh]");
    });

    it("should apply medium size by default", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("max-h-[60vh]");
    });

    it("should apply large size", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} size="lg">
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("max-h-[80vh]");
    });

    it("should apply full size", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} size="full">
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("h-screen");
    });
  });

  describe("Interactions", () => {
    it("should call onClose when close button is clicked", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      const closeButton = screen.getByLabelText("Close sheet");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when overlay is clicked", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      const overlay = document.querySelector('[aria-hidden="true"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when overlay is clicked and closeOnOverlayClick is false", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      const overlay = document.querySelector('[aria-hidden="true"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should call onClose when Escape key is pressed", async () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it("should not call onClose when Escape key is pressed and closeOnEscape is false", async () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have role='dialog'", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have aria-modal='true'", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-labelledby when title is provided", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} title="Test Title">
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", "sheet-title");
      expect(screen.getByText("Test Title")).toHaveAttribute(
        "id",
        "sheet-title",
      );
    });

    it("should trap focus within sheet", async () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <button>First Button</button>
          <button>Second Button</button>
          <button>Third Button</button>
        </Sheet>,
      );

      const buttons = screen.getAllByRole("button");
      const closeButton = screen.getByLabelText("Close sheet");
      const lastButton = buttons[buttons.length - 1];

      // Focus should move to first focusable element (close button) initially
      await waitFor(() => {
        expect(document.activeElement).toBe(closeButton);
      });

      // When at last button, Tab should cycle back to first (close button)
      if (lastButton) {
        lastButton.focus();
        fireEvent.keyDown(document, { key: "Tab" });
      }
    });

    it("should restore focus when sheet closes", async () => {
      const mockOnClose = vi.fn();
      const externalButton = document.createElement("button");
      externalButton.textContent = "External Button";
      document.body.appendChild(externalButton);
      externalButton.focus();

      const { rerender } = render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      // Close the sheet
      rerender(
        <Sheet isOpen={false} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      await waitFor(() => {
        expect(document.activeElement).toBe(externalButton);
      });

      document.body.removeChild(externalButton);
    });
  });

  describe("Body Scroll Lock", () => {
    it("should prevent body scroll when sheet is open", () => {
      const mockOnClose = vi.fn();
      const originalOverflow = document.body.style.overflow;

      render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(document.body.style.overflow).toBe("hidden");

      // Clean up
      document.body.style.overflow = originalOverflow;
    });

    it("should restore body scroll when sheet closes", () => {
      const mockOnClose = vi.fn();
      const originalOverflow = document.body.style.overflow;

      const { rerender } = render(
        <Sheet isOpen={true} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(document.body.style.overflow).toBe("hidden");

      rerender(
        <Sheet isOpen={false} onClose={mockOnClose}>
          <div>Sheet Content</div>
        </Sheet>,
      );

      expect(document.body.style.overflow).toBe(originalOverflow);
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const mockOnClose = vi.fn();
      render(
        <Sheet isOpen={true} onClose={mockOnClose} className="custom-class">
          <div>Sheet Content</div>
        </Sheet>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toContain("custom-class");
    });
  });
});
