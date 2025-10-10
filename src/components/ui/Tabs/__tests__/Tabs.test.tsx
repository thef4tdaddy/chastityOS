/**
 * Tabs Component Tests
 * Tests for the Tabs component including keyboard navigation and accessibility
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabsContent } from "../Tabs";

describe("Tabs Component", () => {
  const mockTabs = [
    { value: "tab1", label: "Tab 1" },
    { value: "tab2", label: "Tab 2" },
    { value: "tab3", label: "Tab 3" },
  ];

  it("should render all tabs", () => {
    const mockOnChange = vi.fn();
    render(
      <Tabs value="tab1" onValueChange={mockOnChange} tabs={mockTabs}>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
  });

  it("should show active tab content", () => {
    const mockOnChange = vi.fn();
    render(
      <Tabs value="tab1" onValueChange={mockOnChange} tabs={mockTabs}>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
  });

  it("should call onValueChange when tab is clicked", () => {
    const mockOnChange = vi.fn();
    render(
      <Tabs value="tab1" onValueChange={mockOnChange} tabs={mockTabs}>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    const tab2Button = screen.getByText("Tab 2");
    fireEvent.click(tab2Button);

    expect(mockOnChange).toHaveBeenCalledWith("tab2");
  });

  it("should have proper ARIA attributes", () => {
    const mockOnChange = vi.fn();
    render(
      <Tabs value="tab1" onValueChange={mockOnChange} tabs={mockTabs}>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    expect(tab1).toHaveAttribute("role", "tab");
    expect(tab1).toHaveAttribute("aria-selected", "true");
    expect(tab1).toHaveAttribute("aria-controls", "tabpanel-tab1");

    const tab2 = screen.getByRole("tab", { name: "Tab 2" });
    expect(tab2).toHaveAttribute("aria-selected", "false");
  });

  it("should support keyboard navigation with arrow keys in horizontal orientation", () => {
    const mockOnChange = vi.fn();
    render(
      <Tabs
        value="tab1"
        onValueChange={mockOnChange}
        tabs={mockTabs}
        orientation="horizontal"
      >
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    const tab1 = screen.getByText("Tab 1");

    // Press ArrowRight
    fireEvent.keyDown(tab1, { key: "ArrowRight" });
    expect(mockOnChange).toHaveBeenCalledWith("tab2");
  });

  it("should support Home and End keys", () => {
    const mockOnChange = vi.fn();
    render(
      <Tabs value="tab2" onValueChange={mockOnChange} tabs={mockTabs}>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    const tab2 = screen.getByText("Tab 2");

    // Press Home
    fireEvent.keyDown(tab2, { key: "Home" });
    expect(mockOnChange).toHaveBeenCalledWith("tab1");

    // Press End
    mockOnChange.mockClear();
    fireEvent.keyDown(tab2, { key: "End" });
    expect(mockOnChange).toHaveBeenCalledWith("tab3");
  });

  it("should render tabs with icons", () => {
    const tabsWithIcons = [
      { value: "tab1", label: "Tab 1", icon: <span>🔥</span> },
      { value: "tab2", label: "Tab 2", icon: <span>⭐</span> },
    ];

    const mockOnChange = vi.fn();
    render(
      <Tabs value="tab1" onValueChange={mockOnChange} tabs={tabsWithIcons}>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(screen.getByText("⭐")).toBeInTheDocument();
  });

  it("should support vertical orientation", () => {
    const mockOnChange = vi.fn();
    const { container } = render(
      <Tabs
        value="tab1"
        onValueChange={mockOnChange}
        tabs={mockTabs}
        orientation="vertical"
      >
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist).toHaveAttribute("aria-orientation", "vertical");
  });

  it("should handle arrow down key in vertical orientation", () => {
    const mockOnChange = vi.fn();
    render(
      <Tabs
        value="tab1"
        onValueChange={mockOnChange}
        tabs={mockTabs}
        orientation="vertical"
      >
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    const tab1 = screen.getByText("Tab 1");

    // Press ArrowDown in vertical orientation
    fireEvent.keyDown(tab1, { key: "ArrowDown" });
    expect(mockOnChange).toHaveBeenCalledWith("tab2");
  });

  it("should have proper tabIndex for active and inactive tabs", () => {
    const mockOnChange = vi.fn();
    render(
      <Tabs value="tab1" onValueChange={mockOnChange} tabs={mockTabs}>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>,
    );

    const tab1 = screen.getByRole("tab", { name: "Tab 1" });
    const tab2 = screen.getByRole("tab", { name: "Tab 2" });

    expect(tab1).toHaveAttribute("tabIndex", "0");
    expect(tab2).toHaveAttribute("tabIndex", "-1");
  });
});
