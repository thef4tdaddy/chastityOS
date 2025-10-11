/**
 * Client-side image compression utilities
 * Optimizes images before upload to reduce bandwidth and storage
 */
import { serviceLogger } from "./logging";

const logger = serviceLogger("ImageCompression");

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file using canvas API
 * Falls back to original file if compression fails or increases size
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    fileType = "image/webp",
    initialQuality = 0.8,
  } = options;

  const originalSize = file.size;

  // Early return if file is already small enough
  if (originalSize <= maxSizeMB * 1024 * 1024 * 0.9) {
    logger.info("File already small enough, skipping compression", {
      fileName: file.name,
    });
    return createResult(file, originalSize, originalSize);
  }

  try {
    logger.info("Starting image compression", {
      fileName: file.name,
      originalSize,
      fileType: file.type,
    });

    const compressedFile = await compressImageToCanvas(
      file,
      maxWidthOrHeight,
      fileType,
      initialQuality,
    );
    const compressedSize = compressedFile.size;

    // If compressed file is larger, use original
    if (compressedSize >= originalSize) {
      logger.info("Compressed file larger than original, using original", {
        fileName: file.name,
        originalSize,
        compressedSize,
      });
      return createResult(file, originalSize, originalSize);
    }

    logger.info("Image compression successful", {
      fileName: file.name,
      originalSize,
      compressedSize,
      compressionRatio: (originalSize / compressedSize).toFixed(2),
      savedBytes: originalSize - compressedSize,
    });

    return createResult(compressedFile, originalSize, compressedSize);
  } catch (error) {
    logger.error("Image compression failed, using original", {
      error: error instanceof Error ? error.message : String(error),
      fileName: file.name,
    });
    return createResult(file, originalSize, originalSize);
  }
}

/**
 * Helper to create compression result
 */
function createResult(
  file: File,
  originalSize: number,
  compressedSize: number,
): CompressionResult {
  return {
    file,
    originalSize,
    compressedSize,
    compressionRatio: originalSize / compressedSize,
  };
}

/**
 * Compress image using canvas
 */
async function compressImageToCanvas(
  file: File,
  maxWidthOrHeight: number,
  fileType: string,
  initialQuality: number,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = calculateDimensions(
    bitmap.width,
    bitmap.height,
    maxWidthOrHeight,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, fileType, initialQuality);
  return new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
    type: fileType,
    lastModified: Date.now(),
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidthOrHeight: number,
): { width: number; height: number } {
  if (width <= maxWidthOrHeight && height <= maxWidthOrHeight) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: maxWidthOrHeight,
      height: Math.round((height * maxWidthOrHeight) / width),
    };
  }

  return {
    width: Math.round((width * maxWidthOrHeight) / height),
    height: maxWidthOrHeight,
  };
}

/**
 * Convert canvas to blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  fileType: string,
  quality: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      fileType,
      quality,
    );
  });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
): Promise<CompressionResult[]> {
  return Promise.all(files.map((file) => compressImage(file, options)));
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(
  file: File,
  size: number = 200,
): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Calculate dimensions to cover the square (crop to fit)
    const scale = Math.max(size / bitmap.width, size / bitmap.height);
    const scaledWidth = bitmap.width * scale;
    const scaledHeight = bitmap.height * scale;
    const x = (size - scaledWidth) / 2;
    const y = (size - scaledHeight) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, x, y, scaledWidth, scaledHeight);

    return canvas.toDataURL("image/jpeg", 0.7);
  } catch (error) {
    logger.error("Thumbnail generation failed", {
      error: error instanceof Error ? error.message : String(error),
      fileName: file.name,
    });
    // Return placeholder or empty data URL
    return "";
  }
}
