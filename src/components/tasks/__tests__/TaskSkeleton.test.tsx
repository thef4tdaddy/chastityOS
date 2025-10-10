/**
 * TaskSkeleton Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskSkeleton } from "../TaskSkeleton";

describe("TaskSkeleton", () => {
  it("should render default number of skeleton items (3)", () => {
    const { container } = render(<TaskSkeleton />);
    const skeletonItems = container.querySelectorAll(
      ".bg-white\\/10.backdrop-blur-sm",
    );
    expect(skeletonItems).toHaveLength(3);
  });

  it("should render custom number of skeleton items", () => {
    const { container } = render(<TaskSkeleton count={5} />);
    const skeletonItems = container.querySelectorAll(
      ".bg-white\\/10.backdrop-blur-sm",
    );
    expect(skeletonItems).toHaveLength(5);
  });

  it("should render with submission section by default", () => {
    const { container } = render(<TaskSkeleton count={1} />);
    // Check if border-t class exists (part of submission section)
    const submissionSection = container.querySelector(".border-t");
    expect(submissionSection).toBeInTheDocument();
  });

  it("should render without submission section when disabled", () => {
    const { container } = render(
      <TaskSkeleton count={1} showSubmission={false} />,
    );
    // Check if border-t class exists (part of submission section)
    const submissionSection = container.querySelector(".border-t");
    expect(submissionSection).not.toBeInTheDocument();
  });

  it("should render with deadline section by default", () => {
    const { container } = render(<TaskSkeleton count={1} />);
    // Deadline section has specific layout
    const deadlineSection = container.querySelector(".text-right");
    expect(deadlineSection).toBeInTheDocument();
  });

  it("should render without deadline section when disabled", () => {
    const { container } = render(
      <TaskSkeleton count={1} showDeadline={false} />,
    );
    // Deadline section has specific layout
    const deadlineSection = container.querySelector(".text-right");
    expect(deadlineSection).not.toBeInTheDocument();
  });
});
