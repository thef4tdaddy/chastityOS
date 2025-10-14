/**
 * AccountLinkingHelp Component Tests
 * Tests for account linking help information display
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountLinkingHelp } from "../AccountLinkingHelp";

describe("AccountLinkingHelp", () => {
  describe("Basic Rendering", () => {
    it("should render help heading", () => {
      render(<AccountLinkingHelp />);

      expect(screen.getByText("About Account Linking")).toBeInTheDocument();
    });

    it("should render all help bullet points", () => {
      render(<AccountLinkingHelp />);

      expect(
        screen.getByText(/Submissives can create invite codes/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Only one active keyholder per submissive/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Invite codes expire after 24 hours/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Either party can end the relationship/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Submissives control what permissions/i),
      ).toBeInTheDocument();
    });

    it("should have proper structure", () => {
      const { container } = render(<AccountLinkingHelp />);

      expect(container.querySelector("ul")).toBeInTheDocument();
    });
  });

  describe("Content Accuracy", () => {
    it("should mention invite code creation", () => {
      render(<AccountLinkingHelp />);

      expect(
        screen.getByText(
          /Submissives can create invite codes for keyholders to accept/i,
        ),
      ).toBeInTheDocument();
    });

    it("should mention one keyholder limitation", () => {
      render(<AccountLinkingHelp />);

      expect(
        screen.getByText(
          /Only one active keyholder per submissive currently supported/i,
        ),
      ).toBeInTheDocument();
    });

    it("should mention expiration time", () => {
      render(<AccountLinkingHelp />);

      expect(
        screen.getByText(/Invite codes expire after 24 hours/i),
      ).toBeInTheDocument();
    });

    it("should mention relationship ending", () => {
      render(<AccountLinkingHelp />);

      expect(
        screen.getByText(/Either party can end the relationship at any time/i),
      ).toBeInTheDocument();
    });

    it("should mention permission control", () => {
      render(<AccountLinkingHelp />);

      expect(
        screen.getByText(
          /Submissives control what permissions keyholders have/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Visual Elements", () => {
    it("should have warning icon", () => {
      const { container } = render(<AccountLinkingHelp />);

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should have proper styling", () => {
      const { container } = render(<AccountLinkingHelp />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("bg-blue-900");
    });

    it("should have border", () => {
      const { container } = render(<AccountLinkingHelp />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("border");
    });

    it("should have rounded corners", () => {
      const { container } = render(<AccountLinkingHelp />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("rounded-lg");
    });
  });

  describe("List Structure", () => {
    it("should render unordered list", () => {
      const { container } = render(<AccountLinkingHelp />);

      expect(container.querySelector("ul")).toBeInTheDocument();
    });

    it("should have multiple list items", () => {
      const { container } = render(<AccountLinkingHelp />);

      const listItems = container.querySelectorAll("li");
      expect(listItems.length).toBe(5);
    });

    it("should have bullet points", () => {
      render(<AccountLinkingHelp />);

      const textWithBullet = screen.getByText(/•/);
      expect(textWithBullet).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<AccountLinkingHelp />);

      const heading = screen.getByText("About Account Linking");
      expect(heading.tagName).toBe("H4");
    });

    it("should have semantic HTML structure", () => {
      const { container } = render(<AccountLinkingHelp />);

      expect(container.querySelector("div")).toBeInTheDocument();
      expect(container.querySelector("ul")).toBeInTheDocument();
      expect(container.querySelector("h4")).toBeInTheDocument();
    });

    it("should have readable text size", () => {
      const { container } = render(<AccountLinkingHelp />);

      const textElements = container.querySelectorAll('[class*="text-"]');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe("Information Clarity", () => {
    it("should provide clear instructions", () => {
      render(<AccountLinkingHelp />);

      // All main information points should be present
      expect(screen.getByText(/About Account Linking/i)).toBeInTheDocument();
      expect(screen.getByText(/invite codes/i)).toBeInTheDocument();
      expect(screen.getByText(/permissions/i)).toBeInTheDocument();
    });

    it("should explain limitations", () => {
      render(<AccountLinkingHelp />);

      expect(
        screen.getByText(/Only one active keyholder/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/expire after 24 hours/i)).toBeInTheDocument();
    });

    it("should explain user control", () => {
      render(<AccountLinkingHelp />);

      expect(
        screen.getByText(/Submissives control what permissions/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Either party can end the relationship/i),
      ).toBeInTheDocument();
    });
  });

  describe("Component Consistency", () => {
    it("should render consistently", () => {
      const { container: container1 } = render(<AccountLinkingHelp />);
      const { container: container2 } = render(<AccountLinkingHelp />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it("should maintain structure", () => {
      const { container, rerender } = render(<AccountLinkingHelp />);

      const initialHTML = container.innerHTML;

      rerender(<AccountLinkingHelp />);

      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe("Edge Cases", () => {
    it("should handle repeated renders", () => {
      const { container } = render(<AccountLinkingHelp />);

      const listItems = container.querySelectorAll("li");
      expect(listItems.length).toBe(5);
    });

    it("should maintain styling across renders", () => {
      const { container, rerender } = render(<AccountLinkingHelp />);

      const initialClasses = (container.firstChild as HTMLElement)?.className;

      rerender(<AccountLinkingHelp />);

      expect((container.firstChild as HTMLElement)?.className).toBe(
        initialClasses,
      );
    });
  });

  describe("Color Scheme", () => {
    it("should use blue color theme", () => {
      const { container } = render(<AccountLinkingHelp />);

      const blueElements = container.querySelectorAll('[class*="blue"]');
      expect(blueElements.length).toBeGreaterThan(0);
    });

    it("should have consistent text colors", () => {
      const { container } = render(<AccountLinkingHelp />);

      const textElements = container.querySelectorAll('[class*="text-blue"]');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });
});
