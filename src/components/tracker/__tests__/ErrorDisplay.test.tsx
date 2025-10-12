/**
 * ErrorDisplay Component Tests
 * Tests for error display with retry and dismiss functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorDisplay } from "../ErrorDisplay";

// Mock the UI components
vi.mock("@/components/ui", () => ({
  Button: vi.fn(({ children, onClick, variant, className, ...props }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  )),
}));

// Mock the icons
vi.mock("../../utils/iconImport", () => ({
  FaExclamationTriangle: ({ className }: { className?: string }) => (
    <span data-testid="warning-icon" className={className}>
      ⚠️
    </span>
  ),
  FaTimes: ({ className }: { className?: string }) => (
    <span data-testid="times-icon" className={className}>
      ✕
    </span>
  ),
}));

describe("ErrorDisplay", () => {
  const mockOnRetry = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render error message from string", () => {
      render(<ErrorDisplay error="Something went wrong" />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should render error message from Error object", () => {
      const error = new Error("Test error message");

      render(<ErrorDisplay error={error} />);

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should not render when error is null", () => {
      const { container } = render(<ErrorDisplay error={null} />);

      expect(container.firstChild).toBeNull();
    });

    it("should display warning icon", () => {
      render(<ErrorDisplay error="Error message" />);

      expect(screen.getByTestId("warning-icon")).toBeInTheDocument();
    });

    it("should have alert role", () => {
      render(<ErrorDisplay error="Error message" />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("Retry Functionality", () => {
    it("should render retry button when onRetry provided", () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} />);

      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    it("should not render retry button when onRetry not provided", () => {
      render(<ErrorDisplay error="Error" />);

      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    });

    it("should call onRetry when retry button clicked", () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} />);

      const retryButton = screen.getByText("Retry");
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it("should use custom retry label when provided", () => {
      render(
        <ErrorDisplay
          error="Error"
          onRetry={mockOnRetry}
          retryLabel="Try Again"
        />,
      );

      expect(screen.getByText("Try Again")).toBeInTheDocument();
      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    });

    it("should apply secondary variant to retry button", () => {
      render(<ErrorDisplay error="Error" onRetry={mockOnRetry} />);

      const retryButton = screen.getByText("Retry");
      expect(retryButton).toHaveAttribute("data-variant", "secondary");
    });
  });

  describe("Dismiss Functionality", () => {
    it("should render dismiss button when onDismiss provided", () => {
      render(<ErrorDisplay error="Error" onDismiss={mockOnDismiss} />);

      expect(screen.getByLabelText("Dismiss error")).toBeInTheDocument();
    });

    it("should not render dismiss button when onDismiss not provided", () => {
      render(<ErrorDisplay error="Error" />);

      expect(screen.queryByLabelText("Dismiss error")).not.toBeInTheDocument();
    });

    it("should call onDismiss when dismiss button clicked", () => {
      render(<ErrorDisplay error="Error" onDismiss={mockOnDismiss} />);

      const dismissButton = screen.getByLabelText("Dismiss error");
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it("should display times icon in dismiss button", () => {
      render(<ErrorDisplay error="Error" onDismiss={mockOnDismiss} />);

      expect(screen.getByTestId("times-icon")).toBeInTheDocument();
    });

    it("should apply ghost variant to dismiss button", () => {
      render(<ErrorDisplay error="Error" onDismiss={mockOnDismiss} />);

      const dismissButton = screen.getByLabelText("Dismiss error");
      expect(dismissButton).toHaveAttribute("data-variant", "ghost");
    });
  });

  describe("Styling", () => {
    it("should apply error styling", () => {
      const { container } = render(<ErrorDisplay error="Error" />);

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("bg-red-900/30");
      expect(alert.className).toContain("border-red-500/50");
    });

    it("should apply custom className", () => {
      render(<ErrorDisplay error="Error" className="custom-class" />);

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("custom-class");
    });

    it("should combine custom className with existing classes", () => {
      render(<ErrorDisplay error="Error" className="custom-class" />);

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("bg-red-900/30");
      expect(alert.className).toContain("custom-class");
    });

    it("should have rounded corners", () => {
      render(<ErrorDisplay error="Error" />);

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("rounded-lg");
    });

    it("should have margin bottom", () => {
      render(<ErrorDisplay error="Error" />);

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("mb-4");
    });
  });

  describe("Layout", () => {
    it("should use flexbox layout", () => {
      const { container } = render(<ErrorDisplay error="Error" />);

      const innerDiv = container.querySelector(".flex");
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv?.className).toContain("items-start");
    });

    it("should have proper gap between elements", () => {
      const { container } = render(<ErrorDisplay error="Error" />);

      const innerDiv = container.querySelector(".flex");
      expect(innerDiv?.className).toContain("gap-3");
    });

    it("should break long words in error message", () => {
      render(
        <ErrorDisplay error="VerylongerrorwithoutspacesthatMightOverflow" />,
      );

      const message = screen.getByText(
        "VerylongerrorwithoutspacesthatMightOverflow",
      );
      expect(message.className).toContain("break-words");
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive padding", () => {
      render(<ErrorDisplay error="Error" />);

      const alert = screen.getByRole("alert");
      expect(alert.className).toContain("p-3");
      expect(alert.className).toContain("sm:p-4");
    });

    it("should have responsive text size for error message", () => {
      render(<ErrorDisplay error="Error" />);

      const message = screen.getByText("Error");
      expect(message.className).toContain("text-sm");
      expect(message.className).toContain("sm:text-base");
    });

    it("should have responsive icon size", () => {
      render(<ErrorDisplay error="Error" />);

      const icon = screen.getByTestId("warning-icon");
      expect(icon.className).toContain("text-lg");
      expect(icon.className).toContain("sm:text-xl");
    });
  });

  describe("Multiple Actions", () => {
    it("should render both retry and dismiss buttons", () => {
      render(
        <ErrorDisplay
          error="Error"
          onRetry={mockOnRetry}
          onDismiss={mockOnDismiss}
        />,
      );

      expect(screen.getByText("Retry")).toBeInTheDocument();
      expect(screen.getByLabelText("Dismiss error")).toBeInTheDocument();
    });

    it("should handle both actions independently", () => {
      render(
        <ErrorDisplay
          error="Error"
          onRetry={mockOnRetry}
          onDismiss={mockOnDismiss}
        />,
      );

      const retryButton = screen.getByText("Retry");
      const dismissButton = screen.getByLabelText("Dismiss error");

      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).not.toHaveBeenCalled();

      fireEvent.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      expect(mockOnRetry).toHaveBeenCalledTimes(1); // Still only once
    });
  });

  describe("Accessibility", () => {
    it("should have alert role for screen readers", () => {
      render(<ErrorDisplay error="Error" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should have aria-label on dismiss button", () => {
      render(<ErrorDisplay error="Error" onDismiss={mockOnDismiss} />);

      expect(screen.getByLabelText("Dismiss error")).toBeInTheDocument();
    });

    it("should have proper color contrast", () => {
      render(<ErrorDisplay error="Error" />);

      const message = screen.getByText("Error");
      expect(message.className).toContain("text-red-200");
    });

    it("should use semantic button elements", () => {
      render(
        <ErrorDisplay
          error="Error"
          onRetry={mockOnRetry}
          onDismiss={mockOnDismiss}
        />,
      );

      const retryButton = screen.getByText("Retry");
      const dismissButton = screen.getByLabelText("Dismiss error");

      expect(retryButton.tagName).toBe("BUTTON");
      expect(dismissButton.tagName).toBe("BUTTON");
    });
  });

  describe("Error Types", () => {
    it("should handle empty string error", () => {
      render(<ErrorDisplay error="" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should handle very long error messages", () => {
      const longError =
        "This is a very long error message that should still be displayed correctly without breaking the layout or causing overflow issues in the component.";

      render(<ErrorDisplay error={longError} />);

      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it("should handle error with special characters", () => {
      render(<ErrorDisplay error="Error: <special> & 'characters'" />);

      expect(
        screen.getByText("Error: <special> & 'characters'"),
      ).toBeInTheDocument();
    });
  });
});
