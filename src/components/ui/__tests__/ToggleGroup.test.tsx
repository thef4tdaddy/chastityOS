/**
 * ToggleGroup Component Tests
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleGroup, ToggleGroupOption } from "../ToggleGroup";

describe("ToggleGroup", () => {
  const basicOptions: ToggleGroupOption[] = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  describe("Single Select Mode", () => {
    it("should render all options", () => {
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("should show selected option with proper styling", () => {
      render(
        <ToggleGroup
          type="single"
          value="option2"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const option2Button = screen.getByRole("radio", { name: "Option 2" });
      expect(option2Button).toHaveAttribute("aria-checked", "true");
    });

    it("should call onValueChange when clicking an option", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={handleChange}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      fireEvent.click(screen.getByRole("radio", { name: "Option 2" }));
      expect(handleChange).toHaveBeenCalledWith("option2");
    });

    it("should render with radiogroup role", () => {
      const { container } = render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const radiogroup = container.querySelector('[role="radiogroup"]');
      expect(radiogroup).toBeInTheDocument();
    });
  });

  describe("Multiple Select Mode", () => {
    it("should allow multiple selections", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup
          type="multiple"
          value={["option1"]}
          onValueChange={handleChange}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      fireEvent.click(screen.getByRole("checkbox", { name: "Option 2" }));
      expect(handleChange).toHaveBeenCalledWith(["option1", "option2"]);
    });

    it("should deselect an option when clicked again", () => {
      const handleChange = vi.fn();
      render(
        <ToggleGroup
          type="multiple"
          value={["option1", "option2"]}
          onValueChange={handleChange}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      fireEvent.click(screen.getByRole("checkbox", { name: "Option 2" }));
      expect(handleChange).toHaveBeenCalledWith(["option1"]);
    });

    it("should render with group role", () => {
      const { container } = render(
        <ToggleGroup
          type="multiple"
          value={[]}
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const group = container.querySelector('[role="group"]');
      expect(group).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should apply small size classes", () => {
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          size="sm"
          aria-label="Test toggle group"
        />,
      );

      const button = screen.getByRole("radio", { name: "Option 1" });
      expect(button.className).toContain("text-xs");
    });

    it("should apply medium size classes by default", () => {
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const button = screen.getByRole("radio", { name: "Option 1" });
      expect(button.className).toContain("text-sm");
    });

    it("should apply large size classes", () => {
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          size="lg"
          aria-label="Test toggle group"
        />,
      );

      const button = screen.getByRole("radio", { name: "Option 1" });
      expect(button.className).toContain("text-base");
    });
  });

  describe("Icons", () => {
    it("should render icons when provided", () => {
      const optionsWithIcons: ToggleGroupOption[] = [
        { value: "option1", label: "Option 1", icon: <span>🎯</span> },
        { value: "option2", label: "Option 2", icon: <span>⭐</span> },
      ];

      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={optionsWithIcons}
          aria-label="Test toggle group"
        />,
      );

      expect(screen.getByText("🎯")).toBeInTheDocument();
      expect(screen.getByText("⭐")).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should disable individual options", () => {
      const optionsWithDisabled: ToggleGroupOption[] = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2", disabled: true },
        { value: "option3", label: "Option 3" },
      ];

      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={optionsWithDisabled}
          aria-label="Test toggle group"
        />,
      );

      const option2Button = screen.getByRole("radio", { name: "Option 2" });
      expect(option2Button).toBeDisabled();
    });

    it("should disable entire group", () => {
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          disabled={true}
          aria-label="Test toggle group"
        />,
      );

      basicOptions.forEach((option) => {
        const button = screen.getByRole("radio", { name: option.label });
        expect(button).toBeDisabled();
      });
    });

    it("should not call onValueChange when disabled option is clicked", () => {
      const handleChange = vi.fn();
      const optionsWithDisabled: ToggleGroupOption[] = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2", disabled: true },
      ];

      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={handleChange}
          options={optionsWithDisabled}
          aria-label="Test toggle group"
        />,
      );

      fireEvent.click(screen.getByRole("radio", { name: "Option 2" }));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Full Width", () => {
    it("should apply full width classes when enabled", () => {
      const { container } = render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          fullWidth={true}
          aria-label="Test toggle group"
        />,
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("w-full");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should move focus to next option with ArrowRight", () => {
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const option1Button = screen.getByRole("radio", { name: "Option 1" });
      const option2Button = screen.getByRole("radio", { name: "Option 2" });

      option1Button.focus();
      fireEvent.keyDown(option1Button, { key: "ArrowRight" });

      expect(option2Button).toHaveFocus();
    });

    it("should move focus to previous option with ArrowLeft", () => {
      render(
        <ToggleGroup
          type="single"
          value="option2"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const option1Button = screen.getByRole("radio", { name: "Option 1" });
      const option2Button = screen.getByRole("radio", { name: "Option 2" });

      option2Button.focus();
      fireEvent.keyDown(option2Button, { key: "ArrowLeft" });

      expect(option1Button).toHaveFocus();
    });

    it("should wrap to last option when pressing ArrowLeft on first option", () => {
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const option1Button = screen.getByRole("radio", { name: "Option 1" });
      const option3Button = screen.getByRole("radio", { name: "Option 3" });

      option1Button.focus();
      fireEvent.keyDown(option1Button, { key: "ArrowLeft" });

      expect(option3Button).toHaveFocus();
    });

    it("should wrap to first option when pressing ArrowRight on last option", () => {
      render(
        <ToggleGroup
          type="single"
          value="option3"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const option1Button = screen.getByRole("radio", { name: "Option 1" });
      const option3Button = screen.getByRole("radio", { name: "Option 3" });

      option3Button.focus();
      fireEvent.keyDown(option3Button, { key: "ArrowRight" });

      expect(option1Button).toHaveFocus();
    });

    it("should move to first option with Home key", () => {
      render(
        <ToggleGroup
          type="single"
          value="option3"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const option1Button = screen.getByRole("radio", { name: "Option 1" });
      const option3Button = screen.getByRole("radio", { name: "Option 3" });

      option3Button.focus();
      fireEvent.keyDown(option3Button, { key: "Home" });

      expect(option1Button).toHaveFocus();
    });

    it("should move to last option with End key", () => {
      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      const option1Button = screen.getByRole("radio", { name: "Option 1" });
      const option3Button = screen.getByRole("radio", { name: "Option 3" });

      option1Button.focus();
      fireEvent.keyDown(option1Button, { key: "End" });

      expect(option3Button).toHaveFocus();
    });

    it("should skip disabled options during keyboard navigation", () => {
      const optionsWithDisabled: ToggleGroupOption[] = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2", disabled: true },
        { value: "option3", label: "Option 3" },
      ];

      render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={optionsWithDisabled}
          aria-label="Test toggle group"
        />,
      );

      const option1Button = screen.getByRole("radio", { name: "Option 1" });
      const option3Button = screen.getByRole("radio", { name: "Option 3" });

      option1Button.focus();
      fireEvent.keyDown(option1Button, { key: "ArrowRight" });

      // Should skip option2 since it's disabled
      expect(option3Button).toHaveFocus();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label", () => {
      const { container } = render(
        <ToggleGroup
          type="single"
          value="option1"
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Color picker"
        />,
      );

      const group = container.querySelector('[aria-label="Color picker"]');
      expect(group).toBeInTheDocument();
    });

    it("should have proper aria-checked attributes", () => {
      render(
        <ToggleGroup
          type="multiple"
          value={["option1", "option3"]}
          onValueChange={vi.fn()}
          options={basicOptions}
          aria-label="Test toggle group"
        />,
      );

      expect(
        screen.getByRole("checkbox", { name: "Option 1" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("checkbox", { name: "Option 2" }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        screen.getByRole("checkbox", { name: "Option 3" }),
      ).toHaveAttribute("aria-checked", "true");
    });
  });
});
