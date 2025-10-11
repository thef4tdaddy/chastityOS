/**
 * TaskEvidenceDisplay Component Tests
 * Tests for evidence display and lightbox functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskEvidenceDisplay } from "../TaskEvidenceDisplay";

// Mock hooks
vi.mock("@/hooks/api/useTaskEvidence", () => ({
  useTaskEvidence: vi.fn(),
}));

import { useTaskEvidence } from "@/hooks/api/useTaskEvidence";

const mockUseTaskEvidence = useTaskEvidence as unknown as ReturnType<
  typeof vi.fn
>;

describe("TaskEvidenceDisplay", () => {
  const mockOnImageClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTaskEvidence.mockReturnValue({
      isConfigured: true,
      getThumbnailUrl: vi.fn(
        (url, width, height) => `${url}?w=${width}&h=${height}`,
      ),
      getOptimizedUrl: vi.fn((url, width) => `${url}?w=${width}`),
    });
  });

  describe("Basic Rendering", () => {
    it("should not render when attachments array is empty", () => {
      const { container } = render(<TaskEvidenceDisplay attachments={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("should not render when attachments is undefined", () => {
      const { container } = render(
        <TaskEvidenceDisplay attachments={undefined as any} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render evidence count", () => {
      const attachments = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
        "https://example.com/image3.jpg",
      ];

      render(<TaskEvidenceDisplay attachments={attachments} />);
      expect(screen.getByText("Evidence (3):")).toBeInTheDocument();
    });

    it("should render thumbnail grid", () => {
      const attachments = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      const images = screen.getAllByRole("button");
      expect(images).toHaveLength(2);
    });
  });

  describe("Thumbnail Display", () => {
    it("should display thumbnails with correct URLs", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      const img = screen.getByAltText("Evidence 1");
      expect(img).toHaveAttribute(
        "src",
        "https://example.com/image1.jpg?w=200&h=200",
      );
    });

    it("should display multiple thumbnails", () => {
      const attachments = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
        "https://example.com/image3.jpg",
      ];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      expect(screen.getByAltText("Evidence 1")).toBeInTheDocument();
      expect(screen.getByAltText("Evidence 2")).toBeInTheDocument();
      expect(screen.getByAltText("Evidence 3")).toBeInTheDocument();
    });

    it("should show fallback icon on image error", () => {
      const attachments = ["https://example.com/broken.jpg"];

      const { container } = render(
        <TaskEvidenceDisplay attachments={attachments} />,
      );

      const img = screen.getByAltText("Evidence 1");
      fireEvent.error(img);

      // After error, fallback icon should appear
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Lightbox Functionality", () => {
    it("should open lightbox on thumbnail click", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      // Lightbox should be visible
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should display full size image in lightbox", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      // Check for optimized image URL in lightbox
      const lightboxImages = screen.getAllByAltText(/Evidence/);
      const fullImage = lightboxImages.find((img) =>
        img.getAttribute("src")?.includes("?w=1600"),
      );
      expect(fullImage).toBeInTheDocument();
    });

    it("should close lightbox on close button click", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open lightbox
      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Close lightbox
      const closeButton = screen.getByLabelText("Close lightbox");
      fireEvent.click(closeButton);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should close lightbox on background click", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open lightbox
      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should close lightbox on Escape key", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open lightbox
      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Navigation in Lightbox", () => {
    const attachments = [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg",
    ];

    it("should show navigation buttons when multiple images", () => {
      render(<TaskEvidenceDisplay attachments={attachments} />);

      const thumbnail = screen.getAllByRole("button")[0];
      fireEvent.click(thumbnail);

      expect(screen.getByLabelText("Previous image")).toBeInTheDocument();
      expect(screen.getByLabelText("Next image")).toBeInTheDocument();
    });

    it("should not show navigation buttons for single image", () => {
      render(
        <TaskEvidenceDisplay
          attachments={["https://example.com/image1.jpg"]}
        />,
      );

      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      expect(screen.queryByLabelText("Previous image")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Next image")).not.toBeInTheDocument();
    });

    it("should navigate to next image", () => {
      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open first image
      const thumbnails = screen.getAllByRole("button");
      fireEvent.click(thumbnails[0]);

      // Check initial counter
      expect(screen.getByText("1 / 3")).toBeInTheDocument();

      // Click next
      const nextButton = screen.getByLabelText("Next image");
      fireEvent.click(nextButton);

      // Check updated counter
      expect(screen.getByText("2 / 3")).toBeInTheDocument();
    });

    it("should navigate to previous image", () => {
      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open second image
      const thumbnails = screen.getAllByRole("button");
      fireEvent.click(thumbnails[1]);

      // Check initial counter
      expect(screen.getByText("2 / 3")).toBeInTheDocument();

      // Click previous
      const prevButton = screen.getByLabelText("Previous image");
      fireEvent.click(prevButton);

      // Check updated counter
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("should wrap to last image when clicking previous on first", () => {
      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open first image
      const thumbnails = screen.getAllByRole("button");
      fireEvent.click(thumbnails[0]);

      // Click previous
      const prevButton = screen.getByLabelText("Previous image");
      fireEvent.click(prevButton);

      // Should show last image
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
    });

    it("should wrap to first image when clicking next on last", () => {
      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open last image
      const thumbnails = screen.getAllByRole("button");
      fireEvent.click(thumbnails[2]);

      // Click next
      const nextButton = screen.getByLabelText("Next image");
      fireEvent.click(nextButton);

      // Should show first image
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("should navigate with arrow keys", () => {
      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open first image
      const thumbnails = screen.getAllByRole("button");
      fireEvent.click(thumbnails[0]);

      const dialog = screen.getByRole("dialog");

      // Press right arrow
      fireEvent.keyDown(dialog, { key: "ArrowRight" });
      expect(screen.getByText("2 / 3")).toBeInTheDocument();

      // Press left arrow
      fireEvent.keyDown(dialog, { key: "ArrowLeft" });
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("should not propagate click on navigation buttons", () => {
      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open lightbox
      const thumbnails = screen.getAllByRole("button");
      fireEvent.click(thumbnails[0]);

      const nextButton = screen.getByLabelText("Next image");
      fireEvent.click(nextButton);

      // Lightbox should still be open
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Image Counter", () => {
    it("should display image counter for multiple images", () => {
      const attachments = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open lightbox
      const thumbnail = screen.getAllByRole("button")[0];
      fireEvent.click(thumbnail);

      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("should not display counter for single image", () => {
      render(
        <TaskEvidenceDisplay
          attachments={["https://example.com/image1.jpg"]}
        />,
      );

      // Open lightbox
      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
    });
  });

  describe("onImageClick Callback", () => {
    it("should call onImageClick when provided", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(
        <TaskEvidenceDisplay
          attachments={attachments}
          onImageClick={mockOnImageClick}
        />,
      );

      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      expect(mockOnImageClick).toHaveBeenCalledWith(
        "https://example.com/image1.jpg",
      );
    });

    it("should work without onImageClick callback", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      const thumbnail = screen.getByRole("button");
      expect(() => fireEvent.click(thumbnail)).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes on lightbox", () => {
      const attachments = ["https://example.com/image1.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open lightbox
      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("tabIndex", "0");
    });

    it("should have descriptive button labels", () => {
      const attachments = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      // Open lightbox
      const thumbnail = screen.getAllByRole("button")[0];
      fireEvent.click(thumbnail);

      expect(screen.getByLabelText("Close lightbox")).toBeInTheDocument();
      expect(screen.getByLabelText("Previous image")).toBeInTheDocument();
      expect(screen.getByLabelText("Next image")).toBeInTheDocument();
    });

    it("should have alt text on all images", () => {
      const attachments = [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      expect(screen.getByAltText("Evidence 1")).toBeInTheDocument();
      expect(screen.getByAltText("Evidence 2")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle image load errors gracefully", () => {
      const attachments = ["https://example.com/broken.jpg"];

      render(<TaskEvidenceDisplay attachments={attachments} />);

      const img = screen.getByAltText("Evidence 1");
      fireEvent.error(img);

      // Component should still render
      expect(screen.getByText("Evidence (1):")).toBeInTheDocument();
    });

    it("should show error icon in lightbox for failed images", () => {
      const attachments = ["https://example.com/broken.jpg"];

      const { container } = render(
        <TaskEvidenceDisplay attachments={attachments} />,
      );

      // Open lightbox
      const thumbnail = screen.getByRole("button");
      fireEvent.click(thumbnail);

      // Trigger error in thumbnail
      const thumbnailImg = screen.getAllByAltText(/Evidence/)[0];
      fireEvent.error(thumbnailImg);

      // Check for error message or icon in lightbox
      expect(screen.getByText("Failed to load image")).toBeInTheDocument();
    });
  });
});
