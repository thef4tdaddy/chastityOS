/**
 * LinkingMessageDisplay Component Tests
 * Tests for displaying linking messages
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LinkingMessageDisplay } from "../LinkingMessageDisplay";

describe("LinkingMessageDisplay", () => {
  const mockOnClearMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render message text", () => {
      render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("should render clear button", () => {
      render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should not render when message is empty", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message=""
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Message Types", () => {
    it("should render success message with green styling", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message="Success message"
          messageType="success"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const messageDiv = container.querySelector("div");
      expect(messageDiv?.className).toContain("green");
    });

    it("should render error message with red styling", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message="Error message"
          messageType="error"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const messageDiv = container.querySelector("div");
      expect(messageDiv?.className).toContain("red");
    });

    it("should render info message with blue styling", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message="Info message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const messageDiv = container.querySelector("div");
      expect(messageDiv?.className).toContain("blue");
    });
  });

  describe("Clear Functionality", () => {
    it("should call onClearMessage when button clicked", () => {
      render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClearMessage).toHaveBeenCalledTimes(1);
    });

    it("should call onClearMessage only once per click", () => {
      render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnClearMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe("Message Content", () => {
    it("should display long messages", () => {
      const longMessage =
        "This is a very long message that should still be displayed correctly";
      render(
        <LinkingMessageDisplay
          message={longMessage}
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should display messages with special characters", () => {
      const specialMessage = "Message with special chars: !@#$%^&*()";
      render(
        <LinkingMessageDisplay
          message={specialMessage}
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it("should display multiline messages", () => {
      const multilineMessage = "Line 1\nLine 2\nLine 3";
      render(
        <LinkingMessageDisplay
          message={multilineMessage}
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      expect(screen.getByText(multilineMessage)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button", () => {
      render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should have proper semantic structure", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      expect(container.querySelector("p")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null message as empty", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message=""
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should handle rapid button clicks", () => {
      render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const button = screen.getByRole("button");

      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        fireEvent.click(button);
      }

      expect(mockOnClearMessage).toHaveBeenCalledTimes(5);
    });

    it("should handle all message types correctly", () => {
      const types: Array<"success" | "error" | "info"> = [
        "success",
        "error",
        "info",
      ];

      types.forEach((type) => {
        const { rerender } = render(
          <LinkingMessageDisplay
            message={`${type} message`}
            messageType={type}
            onClearMessage={mockOnClearMessage}
          />,
        );

        expect(screen.getByText(`${type} message`)).toBeInTheDocument();

        rerender(<div />); // Clear for next iteration
      });
    });
  });

  describe("Visual Styling", () => {
    it("should have rounded corners", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const messageDiv = container.querySelector("div");
      expect(messageDiv?.className).toContain("rounded");
    });

    it("should have border", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const messageDiv = container.querySelector("div");
      expect(messageDiv?.className).toContain("border");
    });

    it("should have padding", () => {
      const { container } = render(
        <LinkingMessageDisplay
          message="Test message"
          messageType="info"
          onClearMessage={mockOnClearMessage}
        />,
      );

      const messageDiv = container.querySelector("div");
      expect(messageDiv?.className).toContain("p-3");
    });
  });
});
