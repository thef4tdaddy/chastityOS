/**
 * Task Storage Service
 * Handles photo/file evidence uploads to Cloudinary for task submissions
 */
import {
  getCloudinaryConfig,
  isCloudinaryConfigured,
} from "./cloudinaryConfig";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("TaskStorageService");

// Supported file types
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface FileValidation {
  valid: boolean;
  error?: string;
}

export class TaskStorageService {
  /**
   * Validate a file before upload
   */
  static validateFile(file: File): FileValidation {
    // Check file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}. Please upload JPG, PNG, HEIC, or WebP images.`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `File too large: ${sizeMB}MB. Maximum size is ${maxSizeMB}MB.`,
      };
    }

    return { valid: true };
  }

  /**
   * Generate a unique filename for the upload
   */
  private static generateFilename(
    taskId: string,
    userId: string,
    originalName: string,
  ): string {
    const timestamp = Date.now();
    const extension = originalName.split(".").pop() || "jpg";
    return `tasks/${userId}/${taskId}/${timestamp}.${extension}`;
  }

  /**
   * Upload evidence file to Cloudinary
   */
  static async uploadEvidence(
    taskId: string,
    userId: string,
    file: File,
    _onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    // Check configuration
    if (!isCloudinaryConfigured()) {
      throw new Error(
        "Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.",
      );
    }

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const config = getCloudinaryConfig();
    const folder = `chastityos/tasks/${userId}/${taskId}`;

    try {
      logger.info("Starting file upload", {
        taskId,
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", config.uploadPreset);
      formData.append("folder", folder);
      formData.append("resource_type", "image");

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("Upload failed", {
          status: response.status,
          error: errorData,
        });
        throw new Error(
          errorData.error?.message ||
            `Upload failed with status ${response.status}`,
        );
      }

      const result = await response.json();

      logger.info("Upload successful", {
        taskId,
        userId,
        publicId: result.public_id,
        url: result.secure_url,
        bytes: result.bytes,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      logger.error("Failed to upload evidence", {
        error: error as Error,
        taskId,
        userId,
        fileName: file.name,
      });
      throw error;
    }
  }

  /**
   * Upload multiple evidence files
   */
  static async uploadMultipleEvidence(
    taskId: string,
    userId: string,
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadEvidence(
        taskId,
        userId,
        file,
        onProgress ? (progress) => onProgress(i, progress) : undefined,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Delete evidence from Cloudinary
   * Note: This requires server-side API call with API secret
   * For now, we'll just log it and handle deletion through Cloudinary dashboard
   */
  static async deleteEvidence(publicId: string): Promise<void> {
    logger.info("Evidence deletion requested", { publicId });
    logger.warn(
      "Client-side deletion not implemented. " +
        "Files should be deleted through Cloudinary dashboard or server-side API.",
    );
    // Note: Actual deletion requires server-side API call with API secret
    // This is a placeholder for client-side tracking
  }

  /**
   * Get thumbnail URL for an image
   */
  static getThumbnailUrl(
    url: string,
    width: number = 300,
    height: number = 300,
  ): string {
    if (!this.isCloudinaryUrl(url)) {
      return url;
    }

    // Transform Cloudinary URL to include thumbnail transformation
    const transformations = `c_fill,w_${width},h_${height},q_auto,f_auto`;
    return url.replace("/upload/", `/upload/${transformations}/`);
  }

  /**
   * Get optimized URL for display
   */
  static getOptimizedUrl(url: string, maxWidth: number = 1200): string {
    if (!this.isCloudinaryUrl(url)) {
      return url;
    }

    // Apply auto format and quality optimization
    const transformations = `w_${maxWidth},c_limit,q_auto,f_auto`;
    return url.replace("/upload/", `/upload/${transformations}/`);
  }
  /**
   * Check if a URL points to Cloudinary by hostname.
   */
  private static isCloudinaryUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      // Accept exact match or subdomains like <anything>.cloudinary.com
      return (
        hostname === "res.cloudinary.com" ||
        hostname.endsWith(".cloudinary.com")
      );
    } catch {
      // Malformed URL; treat as not Cloudinary
      return false;
    }
  }
}
