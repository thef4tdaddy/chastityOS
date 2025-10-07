/**
 * Task Storage Service Tests
 * Tests for Cloudinary file upload and validation
 */

import { describe, it, expect } from "vitest";
import { TaskStorageService } from "../TaskStorageService";

describe("TaskStorageService", () => {
  describe("validateFile", () => {
    it("should validate supported image types", () => {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/heic",
        "image/heif",
        "image/webp",
      ];

      validTypes.forEach((type) => {
        const file = new File(["test"], "test.jpg", { type });
        const result = TaskStorageService.validateFile(file);
        expect(result.valid).toBe(true);
      });
    });

    it("should reject unsupported file types", () => {
      const invalidTypes = ["image/gif", "image/bmp", "application/pdf"];

      invalidTypes.forEach((type) => {
        const file = new File(["test"], "test.file", { type });
        const result = TaskStorageService.validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it("should reject files larger than 5MB", () => {
      const largeContent = new Uint8Array(6 * 1024 * 1024);
      const file = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });

      const result = TaskStorageService.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("File too large");
    });

    it("should accept files smaller than 5MB", () => {
      const smallContent = new Uint8Array(1 * 1024 * 1024);
      const file = new File([smallContent], "small.jpg", {
        type: "image/jpeg",
      });

      const result = TaskStorageService.validateFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe("getThumbnailUrl", () => {
    it("should transform Cloudinary URLs", () => {
      const url = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
      const thumbnailUrl = TaskStorageService.getThumbnailUrl(url, 300, 300);

      expect(thumbnailUrl).toContain(
        "/upload/c_fill,w_300,h_300,q_auto,f_auto/",
      );
    });

    it("should return original URL for non-Cloudinary URLs", () => {
      const url = "https://example.com/image.jpg";
      const thumbnailUrl = TaskStorageService.getThumbnailUrl(url);

      expect(thumbnailUrl).toBe(url);
    });
  });

  describe("getOptimizedUrl", () => {
    it("should transform Cloudinary URLs", () => {
      const url = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
      const optimizedUrl = TaskStorageService.getOptimizedUrl(url, 1200);

      expect(optimizedUrl).toContain("/upload/w_1200,c_limit,q_auto,f_auto/");
    });

    it("should return original URL for non-Cloudinary URLs", () => {
      const url = "https://example.com/image.jpg";
      const optimizedUrl = TaskStorageService.getOptimizedUrl(url);

      expect(optimizedUrl).toBe(url);
    });
  });
});
