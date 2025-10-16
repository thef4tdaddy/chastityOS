/**
 * Select Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select, SelectOption } from "../Select";

const mockOptions: SelectOption[] = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
  { value: "option4", label: "Option 4", disabled: true },
];

describe("Select Component", () => {
  describe("Basic Rendering", () => {
    it("should render with basic props", () => {
      const onChange = vi.fn();
      render(
        <Select
          value="option1"
          onChange={onChange}
          options={mockOptions}
          data-testid="test-select"
        />,
      );

      const select = screen.getByTestId("test-select");
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue("option1");
    });

    it("should render with label", () => {
      const onChange = vi.fn();
      render(
        <Select
          label="Test Label"
          value="option1"
          onChange={onChange}
          options={mockOptions}
        />,
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("should render all options", () => {
      const onChange = vi.fn();
      render(
        <Select value="option1" onChange={onChange} options={mockOptions} />,
      );

      mockOptions.forEach((option) => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
    });
  });

  describe("Interactions", () => {
    it("should call onChange with correct value when option selected", () => {
      const onChange = vi.fn();
      render(
        <Select
          value="option1"
          onChange={onChange}
          options={mockOptions}
          data-testid="test-select"
        />,
      );

      const select = screen.getByTestId("test-select");
      fireEvent.change(select, { target: { value: "option2" } });

      expect(onChange).toHaveBeenCalledWith("option2");
    });
  });
});
