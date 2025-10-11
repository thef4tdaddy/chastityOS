/**
 * Accordion Tests
 * Unit tests for Accordion component functionality
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion } from "../Accordion";
import { AccordionItem } from "../AccordionItem";

describe("Accordion", () => {
  describe("Single Select Mode", () => {
    it("should render all accordion items", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
          <AccordionItem value="item-3" title="Section 3">
            Content 3
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
      expect(screen.getByText("Section 3")).toBeInTheDocument();
    });

    it("should expand item when clicked", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      fireEvent.click(trigger);

      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("should collapse previously expanded item when another is opened", async () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      // Open first item
      fireEvent.click(screen.getByText("Section 1"));
      expect(screen.getByText("Content 1")).toBeInTheDocument();

      // Open second item
      fireEvent.click(screen.getByText("Section 2"));
      expect(screen.getByText("Content 2")).toBeInTheDocument();
      
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("should toggle item closed when clicked again", async () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");

      // Open
      fireEvent.click(trigger);
      expect(screen.getByText("Content 1")).toBeInTheDocument();

      // Close
      fireEvent.click(trigger);
      
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });
  });

  describe("Multiple Select Mode", () => {
    it("should allow multiple items to be open simultaneously", () => {
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
          <AccordionItem value="item-3" title="Section 3">
            Content 3
          </AccordionItem>
        </Accordion>,
      );

      // Open first item
      fireEvent.click(screen.getByText("Section 1"));
      expect(screen.getByText("Content 1")).toBeInTheDocument();

      // Open second item
      fireEvent.click(screen.getByText("Section 2"));
      expect(screen.getByText("Content 2")).toBeInTheDocument();

      // Both should still be visible
      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("should toggle individual items independently", async () => {
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      // Open both items
      fireEvent.click(screen.getByText("Section 1"));
      fireEvent.click(screen.getByText("Section 2"));
      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();

      // Close first item
      fireEvent.click(screen.getByText("Section 1"));
      
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });

  describe("Controlled Mode", () => {
    it("should use controlled value for single mode", async () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <Accordion type="single" value="item-1" onValueChange={handleChange}>
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Section 2"));
      expect(handleChange).toHaveBeenCalledWith("item-2");

      // In controlled mode, component doesn't change state itself
      rerender(
        <Accordion type="single" value="item-2" onValueChange={handleChange}>
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("should use controlled value for multiple mode", () => {
      const handleChange = vi.fn();
      render(
        <Accordion
          type="multiple"
          value={["item-1"]}
          onValueChange={handleChange}
        >
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Section 2"));
      expect(handleChange).toHaveBeenCalledWith(["item-1", "item-2"]);
    });
  });

  describe("Uncontrolled Mode", () => {
    it("should use defaultValue for initial state in single mode", () => {
      render(
        <Accordion type="single" defaultValue="item-2">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("should use defaultValue for initial state in multiple mode", () => {
      render(
        <Accordion type="multiple" defaultValue={["item-1", "item-3"]}>
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
          <AccordionItem value="item-3" title="Section 3">
            Content 3
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
      expect(screen.getByText("Content 3")).toBeInTheDocument();
    });

    it("should manage its own state in uncontrolled mode", async () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("Section 1"));
      expect(screen.getByText("Content 1")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Section 2"));
      expect(screen.getByText("Content 2")).toBeInTheDocument();
      
      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle Enter key to toggle item", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      fireEvent.keyDown(trigger, { key: "Enter" });

      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("should handle Space key to toggle item", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      fireEvent.keyDown(trigger, { key: " " });

      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should not open disabled items", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1" disabled>
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      fireEvent.click(trigger);

      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("should have disabled attribute on disabled items", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1" disabled>
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger).toBeDisabled();
      expect(trigger).toHaveAttribute("aria-disabled", "true");
    });

    it("should not respond to keyboard events when disabled", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1" disabled>
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1");
      fireEvent.keyDown(trigger, { key: "Enter" });

      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("should apply default variant classes", () => {
      const { container } = render(
        <Accordion type="single" variant="default">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      expect(container.firstChild).toHaveClass(
        "border-t",
        "border-gray-200",
        "dark:border-gray-700",
      );
    });

    it("should apply bordered variant classes", () => {
      const { container } = render(
        <Accordion type="single" variant="bordered">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      // Bordered variant doesn't have border-t on container
      expect(container.firstChild).not.toHaveClass("border-t");
    });

    it("should apply separated variant classes", () => {
      const { container } = render(
        <Accordion type="single" variant="separated">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      // Separated variant doesn't have border-t on container
      expect(container.firstChild).not.toHaveClass("border-t");
    });

    it("should apply flush variant classes", () => {
      const { container } = render(
        <Accordion type="single" variant="flush">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      // Flush variant has minimal styling
      expect(container.firstChild).not.toHaveClass("border-t");
    });
  });

  describe("Size Variants", () => {
    it("should apply small size classes", () => {
      render(
        <Accordion type="single" size="sm">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger?.className).toContain("text-sm");
      expect(trigger?.className).toContain("py-2");
    });

    it("should apply medium size classes", () => {
      render(
        <Accordion type="single" size="md">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger?.className).toContain("text-base");
      expect(trigger?.className).toContain("py-3");
    });

    it("should apply large size classes", () => {
      render(
        <Accordion type="single" size="lg">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger?.className).toContain("text-lg");
      expect(trigger?.className).toContain("py-4");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes on trigger", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveAttribute("aria-controls");
      expect(trigger).toHaveAttribute("type", "button");
    });

    it("should update aria-expanded when item is opened", () => {
      render(
        <Accordion type="single">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(trigger!);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("should have proper role and aria-labelledby on content", () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const content = screen.getByText("Content 1").closest('[role="region"]');
      expect(content).toHaveAttribute("role", "region");
      expect(content).toHaveAttribute("aria-labelledby");
    });

    it("should link trigger and content with matching IDs", () => {
      render(
        <Accordion type="single" defaultValue="item-1">
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText("Section 1").closest("button");
      const content = screen.getByText("Content 1").closest('[role="region"]');

      const triggerId = trigger?.getAttribute("id");
      const contentId = content?.getAttribute("id");
      const ariaControls = trigger?.getAttribute("aria-controls");
      const ariaLabelledby = content?.getAttribute("aria-labelledby");

      expect(ariaControls).toBe(contentId);
      expect(ariaLabelledby).toBe(triggerId);
    });
  });

  describe("onValueChange Callback", () => {
    it("should call onValueChange in single mode", () => {
      const handleChange = vi.fn();
      render(
        <Accordion type="single" onValueChange={handleChange}>
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      fireEvent.click(screen.getByText("Section 1"));
      expect(handleChange).toHaveBeenCalledWith("item-1");
    });

    it("should call onValueChange in multiple mode", () => {
      const handleChange = vi.fn();
      render(
        <Accordion type="multiple" onValueChange={handleChange}>
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
          <AccordionItem value="item-2" title="Section 2">
            Content 2
          </AccordionItem>
        </Accordion>,
      );

      fireEvent.click(screen.getByText("Section 1"));
      expect(handleChange).toHaveBeenCalledWith(["item-1"]);

      fireEvent.click(screen.getByText("Section 2"));
      expect(handleChange).toHaveBeenCalledWith(["item-1", "item-2"]);
    });

    it("should call onValueChange with empty string when closing in single mode", () => {
      const handleChange = vi.fn();
      render(
        <Accordion type="single" defaultValue="item-1" onValueChange={handleChange}>
          <AccordionItem value="item-1" title="Section 1">
            Content 1
          </AccordionItem>
        </Accordion>,
      );

      fireEvent.click(screen.getByText("Section 1"));
      expect(handleChange).toHaveBeenCalledWith("");
    });
  });
});
