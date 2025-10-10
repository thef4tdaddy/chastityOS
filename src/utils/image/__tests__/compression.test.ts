/**
 * Image Compression Tests
 */
import { describe, it, expect } from "vitest";
import {
  isImageFile,
  validateImageFile,
  type CompressionOptions,
} from "../compression";

describe("Image Compression Utilities", () => {
  describe("isImageFile", () => {
    it("should return true for image files", () => {
      const imageFile = new File([""], "test.jpg", { type: "image/jpeg" });
      expect(isImageFile(imageFile)).toBe(true);
    });

    it("should return true for various image types", () => {
      const types = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      types.forEach((type) => {
        const file = new File([""], "test.jpg", { type });
        expect(isImageFile(file)).toBe(true);
      });
    });

    it("should return false for non-image files", () => {
      const textFile = new File([""], "test.txt", { type: "text/plain" });
      expect(isImageFile(textFile)).toBe(false);
    });

    it("should return false for video files", () => {
      const videoFile = new File([""], "test.mp4", { type: "video/mp4" });
      expect(isImageFile(videoFile)).toBe(false);
    });
  });

  describe("validateImageFile", () => {
    it("should validate a valid image file", () => {
      const imageFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const result = validateImageFile(imageFile);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject non-image files", () => {
      const textFile = new File(["test"], "test.txt", { type: "text/plain" });
      const result = validateImageFile(textFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("File must be an image");
    });

    it("should reject unsupported image types", () => {
      const svgFile = new File(["test"], "test.svg", { type: "image/svg+xml" });
      const result = validateImageFile(svgFile, {
        allowedTypes: ["image/jpeg", "image/png"],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not supported");
    });

    it("should reject files that are too large", () => {
      // Create a 6MB file
      const largeFile = new File(
        [new ArrayBuffer(6 * 1024 * 1024)],
        "large.jpg",
        {
          type: "image/jpeg",
        },
      );
      const result = validateImageFile(largeFile, { maxSizeMB: 5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too large");
    });

    it("should accept files within size limit", () => {
      // Create a 1MB file
      const smallFile = new File(
        [new ArrayBuffer(1 * 1024 * 1024)],
        "small.jpg",
        {
          type: "image/jpeg",
        },
      );
      const result = validateImageFile(smallFile, { maxSizeMB: 5 });
      expect(result.valid).toBe(true);
    });

    it("should use default allowed types", () => {
      const webpFile = new File(["test"], "test.webp", { type: "image/webp" });
      const result = validateImageFile(webpFile);
      expect(result.valid).toBe(true);
    });

    it("should use default max size of 5MB", () => {
      // Create a 6MB file
      const largeFile = new File(
        [new ArrayBuffer(6 * 1024 * 1024)],
        "large.jpg",
        {
          type: "image/jpeg",
        },
      );
      const result = validateImageFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too large");
    });
  });

  describe("compression integration", () => {
    it("should export compression options type", () => {
      const options: CompressionOptions = {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        maxSizeMB: 2,
      };
      expect(options).toBeDefined();
    });
  });
});
