/**
 * ToggleGroup Tests
 * Unit tests for ToggleGroup component functionality
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleGroup } from "../ToggleGroup";

describe("ToggleGroup", () => {
  const mockOptions = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  describe("Single Select Mode", () => {
    it("should render all options", () => {
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup
          value="option1"
          onValueChange={mockOnChange}
          options={mockOptions}
          type="single"
        />,
      );

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("should call onValueChange when option is clicked", () => {
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup
          value="option1"
          onValueChange={mockOnChange}
          options={mockOptions}
          type="single"
        />,
      );

      fireEvent.click(screen.getByText("Option 2"));
      expect(mockOnChange).toHaveBeenCalledWith("option2");
    });

    it("should show selected state correctly", () => {
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup
          value="option2"
          onValueChange={mockOnChange}
          options={mockOptions}
          type="single"
        />,
      );

      const option2Button = screen.getByText("Option 2").closest("button");
      expect(option2Button).toHaveAttribute("aria-checked", "true");
    });

    it("should handle keyboard navigation with Enter key", () => {
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup
          value="option1"
          onValueChange={mockOnChange}
          options={mockOptions}
          type="single"
        />,
      );

      const option2Button = screen.getByText("Option 2");
      fireEvent.keyDown(option2Button, { key: "Enter" });
      expect(mockOnChange).toHaveBeenCalledWith("option2");
    });

    it("should handle keyboard navigation with Space key", () => {
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup
          value="option1"
          onValueChange={mockOnChange}
          options={mockOptions}
          type="single"
        />,
      );

      const option3Button = screen.getByText("Option 3");
      fireEvent.keyDown(option3Button, { key: " " });
      expect(mockOnChange).toHaveBeenCalledWith("option3");
    });
  });

  describe("Multiple Select Mode", () => {
    it("should handle multiple selections", () => {
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup
          value={["option1"]}
          onValueChange={mockOnChange}
          options={mockOptions}
          type="multiple"
        />,
      );

      fireEvent.click(screen.getByText("Option 2"));
      expect(mockOnChange).toHaveBeenCalledWith(["option1", "option2"]);
    });

    it("should handle deselection in multiple mode", () => {
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup
          value={["option1", "option2"]}
          onValueChange={mockOnChange}
          options={mockOptions}
          type="multiple"
        />,
      );

      fireEvent.click(screen.getByText("Option 1"));
      expect(mockOnChange).toHaveBeenCalledWith(["option2"]);
    });

    it("should show multiple selected states", () => {
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup
          value={["option1", "option3"]}
          onValueChange={mockOnChange}
          options={mockOptions}
          type="multiple"
        />,
      );

      const option1Button = screen.getByText("Option 1").closest("button");
      const option2Button = screen.getByText("Option 2").closest("button");
      const option3Button = screen.getByText("Option 3").closest("button");

      expect(option1Button).toHaveAttribute("aria-checked", "true");
      expect(option2Button).toHaveAttribute("aria-checked", "false");
      expect(option3Button).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("Disabled Options", () => {
    it("should not trigger onChange for disabled options", () => {
      const mockOnChange = vi.fn();
      const optionsWithDisabled = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2", disabled: true },
        { value: "option3", label: "Option 3" },
      ];

      render(
        <ToggleGroup
          value="option1"
          onValueChange={mockOnChange}
          options={optionsWithDisabled}
          type="single"
        />,
      );

      fireEvent.click(screen.getByText("Option 2"));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should have disabled attribute on disabled options", () => {
      const optionsWithDisabled = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2", disabled: true },
      ];

      render(
        <ToggleGroup
          value="option1"
          onValueChange={vi.fn()}
          options={optionsWithDisabled}
          type="single"
        />,
      );

      const option2Button = screen.getByText("Option 2").closest("button");
      expect(option2Button).toBeDisabled();
    });
  });

  describe("Size Variants", () => {
    it("should apply small size classes", () => {
      render(
        <ToggleGroup
          value="option1"
          onValueChange={vi.fn()}
          options={mockOptions}
          size="sm"
        />,
      );

      const button = screen.getByText("Option 1").closest("button");
      expect(button?.className).toContain("text-xs");
    });

    it("should apply large size classes", () => {
      render(
        <ToggleGroup
          value="option1"
          onValueChange={vi.fn()}
          options={mockOptions}
          size="lg"
        />,
      );

      const button = screen.getByText("Option 1").closest("button");
      expect(button?.className).toContain("text-base");
    });
  });

  describe("Full Width Option", () => {
    it("should apply full width classes", () => {
      render(
        <ToggleGroup
          value="option1"
          onValueChange={vi.fn()}
          options={mockOptions}
          fullWidth
        />,
      );

      const container = screen
        .getByText("Option 1")
        .closest("div[role='group']");
      expect(container?.className).toContain("w-full");
    });
  });

  describe("Icons", () => {
    it("should render icons when provided", () => {
      const optionsWithIcons = [
        { value: "option1", label: "Option 1", icon: <span>🔒</span> },
        { value: "option2", label: "Option 2", icon: <span>🔓</span> },
      ];

      render(
        <ToggleGroup
          value="option1"
          onValueChange={vi.fn()}
          options={optionsWithIcons}
        />,
      );

      expect(screen.getByText("🔒")).toBeInTheDocument();
      expect(screen.getByText("🔓")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes for single mode", () => {
      render(
        <ToggleGroup
          value="option1"
          onValueChange={vi.fn()}
          options={mockOptions}
          type="single"
          aria-label="Select option"
        />,
      );

      const container = screen.getByRole("group");
      expect(container).toHaveAttribute("aria-label", "Select option");

      const buttons = screen.getAllByRole("radio");
      expect(buttons).toHaveLength(3);
    });

    it("should have proper ARIA attributes for multiple mode", () => {
      render(
        <ToggleGroup
          value={["option1"]}
          onValueChange={vi.fn()}
          options={mockOptions}
          type="multiple"
        />,
      );

      const buttons = screen.getAllByRole("checkbox");
      expect(buttons).toHaveLength(3);
    });
  });
});
