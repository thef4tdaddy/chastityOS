/**
 * TaskEvidenceUpload Component Tests
 * Tests for file upload functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskEvidenceUpload } from "../TaskEvidenceUpload";

// Mock hooks
vi.mock("@/hooks/api/useTaskEvidence", () => ({
  useTaskEvidence: vi.fn(),
}));

vi.mock("../useEvidenceUpload", () => ({
  useEvidenceUpload: vi.fn(),
}));

import { useTaskEvidence } from "@/hooks/api/useTaskEvidence";
import { useEvidenceUpload } from "../useEvidenceUpload";

const mockUseTaskEvidence = useTaskEvidence as unknown as ReturnType<
  typeof vi.fn
>;
const mockUseEvidenceUpload = useEvidenceUpload as unknown as ReturnType<
  typeof vi.fn
>;

describe("TaskEvidenceUpload", () => {
  const mockOnUploadComplete = vi.fn();
  const baseEvidenceReturn = {
    isConfigured: true,
    getThumbnailUrl: vi.fn((url) => url),
    getOptimizedUrl: vi.fn((url) => url),
  };

  const baseUploadReturn = {
    files: [],
    isDragging: false,
    fileInputRef: { current: null },
    handleFiles: vi.fn(),
    removeFile: vi.fn(),
    uploadAllFiles: vi.fn(),
    setIsDragging: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTaskEvidence.mockReturnValue(baseEvidenceReturn);
    mockUseEvidenceUpload.mockReturnValue(baseUploadReturn);
  });

  describe("Configuration Check", () => {
    it("should display warning when upload not configured", () => {
      mockUseTaskEvidence.mockReturnValue({
        ...baseEvidenceReturn,
        isConfigured: false,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      expect(
        screen.getByText(/Photo uploads are not configured/),
      ).toBeInTheDocument();
    });

    it("should show upload zone when configured", () => {
      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      expect(screen.getByText(/Drag and drop photos here/)).toBeInTheDocument();
    });
  });

  describe("Upload Zone", () => {
    it("should render upload zone with correct text", () => {
      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
          maxFiles={5}
        />,
      );

      expect(screen.getByText(/Drag and drop photos here/)).toBeInTheDocument();
      expect(
        screen.getByText(/JPG, PNG, HEIC, WebP \(max 5 files/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Choose Files/i }),
      ).toBeInTheDocument();
    });

    it("should render browse button", () => {
      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      const browseButton = screen.getByRole("button", {
        name: /Choose Files/i,
      });
      expect(browseButton).toBeInTheDocument();
      expect(browseButton).not.toBeDisabled();
    });

    it("should show dragging state", () => {
      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        isDragging: true,
      });

      const { container } = render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      // Check for dragging styles
      const dropZone = container.querySelector(".border-dashed");
      expect(dropZone).toHaveClass("border-blue-400", "bg-blue-900/20");
    });
  });

  describe("Drag and Drop", () => {
    it("should handle drag enter", () => {
      const mockSetIsDragging = vi.fn();
      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        setIsDragging: mockSetIsDragging,
      });

      const { container } = render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      const dropZone = container.querySelector(".border-dashed");
      if (dropZone) {
        fireEvent.dragEnter(dropZone);
        expect(mockSetIsDragging).toHaveBeenCalledWith(true);
      }
    });

    it("should handle drag leave", () => {
      const mockSetIsDragging = vi.fn();
      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        setIsDragging: mockSetIsDragging,
      });

      const { container } = render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      const dropZone = container.querySelector(".border-dashed");
      if (dropZone) {
        fireEvent.dragLeave(dropZone);
        expect(mockSetIsDragging).toHaveBeenCalledWith(false);
      }
    });

    it("should handle file drop", () => {
      const mockHandleFiles = vi.fn();
      const mockSetIsDragging = vi.fn();
      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        handleFiles: mockHandleFiles,
        setIsDragging: mockSetIsDragging,
      });

      const { container } = render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      const dropZone = container.querySelector(".border-dashed");
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });

      if (dropZone) {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file] },
        });

        expect(mockSetIsDragging).toHaveBeenCalledWith(false);
        expect(mockHandleFiles).toHaveBeenCalled();
      }
    });
  });

  describe("File Display", () => {
    it("should display selected files", () => {
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test1.jpg", { type: "image/jpeg" }),
          preview: "blob:test1",
          uploading: false,
          url: null,
          error: null,
        },
        {
          id: "file-2",
          file: new File(["content"], "test2.jpg", { type: "image/jpeg" }),
          preview: "blob:test2",
          uploading: false,
          url: null,
          error: null,
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
          maxFiles={5}
        />,
      );

      expect(screen.getByText("2 / 5 files selected")).toBeInTheDocument();
    });

    it("should show uploading state", () => {
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: true,
          url: null,
          error: null,
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      const { container } = render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      // Check for spinner icon in uploading state
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should show uploaded state", () => {
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: false,
          url: "https://example.com/uploaded.jpg",
          error: null,
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      const { container } = render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      // Check for success icon
      const images = container.querySelectorAll("img");
      expect(images.length).toBeGreaterThan(0);
    });

    it("should show error state", () => {
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: false,
          url: null,
          error: "Upload failed",
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });
  });

  describe("File Removal", () => {
    it("should handle file removal", () => {
      const mockRemoveFile = vi.fn();
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: false,
          url: null,
          error: null,
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
        removeFile: mockRemoveFile,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      const removeButton = screen.getByLabelText("Remove file");
      fireEvent.click(removeButton);

      expect(mockRemoveFile).toHaveBeenCalledWith("file-1");
    });

    it("should not show remove button during upload", () => {
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: true,
          url: null,
          error: null,
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      expect(screen.queryByLabelText("Remove file")).not.toBeInTheDocument();
    });
  });

  describe("Upload Button", () => {
    it("should show upload button when files are selected", () => {
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: false,
          url: null,
          error: null,
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      expect(
        screen.getByRole("button", { name: /Upload 1 Photo/i }),
      ).toBeInTheDocument();
    });

    it("should call uploadAllFiles on button click", () => {
      const mockUploadAllFiles = vi.fn();
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: false,
          url: null,
          error: null,
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
        uploadAllFiles: mockUploadAllFiles,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      const uploadButton = screen.getByRole("button", {
        name: /Upload 1 Photo/i,
      });
      fireEvent.click(uploadButton);

      expect(mockUploadAllFiles).toHaveBeenCalled();
    });

    it("should disable upload button when errors exist", () => {
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: false,
          url: null,
          error: "File too large",
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      // Button is hidden when there are errors (hasErrors = true and no files without errors)
      expect(
        screen.queryByRole("button", { name: /Upload.*Photo/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show upload button when all files are uploaded", () => {
      const mockFiles = [
        {
          id: "file-1",
          file: new File(["content"], "test.jpg", { type: "image/jpeg" }),
          preview: "blob:test",
          uploading: false,
          url: "https://example.com/uploaded.jpg",
          error: null,
        },
      ];

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /Upload.*Photo/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Max Files Limit", () => {
    it("should hide upload zone when max files reached", () => {
      const mockFiles = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `file-${i}`,
          file: new File(["content"], `test${i}.jpg`, { type: "image/jpeg" }),
          preview: `blob:test${i}`,
          uploading: false,
          url: null,
          error: null,
        }));

      mockUseEvidenceUpload.mockReturnValue({
        ...baseUploadReturn,
        files: mockFiles,
      });

      render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
          maxFiles={5}
        />,
      );

      expect(
        screen.queryByText(/Drag and drop photos here/),
      ).not.toBeInTheDocument();
      expect(screen.getByText("5 / 5 files selected")).toBeInTheDocument();
    });
  });

  describe("File Input", () => {
    it("should have correct accept attribute", () => {
      const { container } = render(
        <TaskEvidenceUpload
          taskId="task-1"
          userId="user-1"
          onUploadComplete={mockOnUploadComplete}
        />,
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute(
        "accept",
        "image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp",
      );
      expect(fileInput).toHaveAttribute("multiple");
    });
  });
});
