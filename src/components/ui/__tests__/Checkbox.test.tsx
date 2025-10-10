/**
 * Checkbox Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Checkbox } from "../Form/Checkbox";

describe("Checkbox", () => {
  it("should render unchecked checkbox", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("should render checked checkbox", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={true} onChange={onChange} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("should call onChange with boolean when clicked", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} label="Test Label" />);

    const label = screen.getByText("Test Label");
    fireEvent.click(label);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("should render label when provided", () => {
    const onChange = vi.fn();
    render(
      <Checkbox checked={false} onChange={onChange} label="My Checkbox" />,
    );

    expect(screen.getByText("My Checkbox")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    const onChange = vi.fn();
    render(
      <Checkbox
        checked={false}
        onChange={onChange}
        label="Label"
        description="This is a description"
      />,
    );

    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  it("should render error message when provided", () => {
    const onChange = vi.fn();
    render(
      <Checkbox
        checked={false}
        onChange={onChange}
        error="This field is required"
      />,
    );

    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("should not call onChange when disabled", () => {
    const onChange = vi.fn();
    render(
      <Checkbox
        checked={false}
        onChange={onChange}
        disabled
        label="Disabled"
      />,
    );

    const label = screen.getByText("Disabled");
    fireEvent.click(label);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("should handle keyboard interaction with space key", () => {
    const onChange = vi.fn();
    render(
      <Checkbox checked={false} onChange={onChange} label="Keyboard Test" />,
    );

    const label = screen.getByText("Keyboard Test").closest("label");
    if (label) {
      fireEvent.keyDown(label, { key: " " });
    }

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("should render different sizes", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Checkbox checked={false} onChange={onChange} size="sm" label="Small" />,
    );

    expect(screen.getByText("Small")).toBeInTheDocument();

    rerender(
      <Checkbox checked={false} onChange={onChange} size="md" label="Medium" />,
    );
    expect(screen.getByText("Medium")).toBeInTheDocument();

    rerender(
      <Checkbox checked={false} onChange={onChange} size="lg" label="Large" />,
    );
    expect(screen.getByText("Large")).toBeInTheDocument();
  });

  it("should render indeterminate state", () => {
    const onChange = vi.fn();
    render(
      <Checkbox
        checked={false}
        onChange={onChange}
        indeterminate
        label="Indeterminate"
      />,
    );

    expect(screen.getByText("Indeterminate")).toBeInTheDocument();
  });

  it("should use custom id when provided", () => {
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} id="custom-id" />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("id", "custom-id");
  });
});
